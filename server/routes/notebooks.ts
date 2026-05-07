import { Router } from 'express';
import multer from 'multer';

import {
  createNotebook,
  getNotebook,
  listNotebooks,
  deleteNotebook,
  updateNotebook,
  bumpAsks,
} from '../lib/store.js';
import { indexFile } from '../lib/indexer.js';
import { embedQuery, ai, GEN_MODEL } from '../lib/gemini.js';
import { searchChunks, deleteCollection, getSourceText } from '../lib/qdrant.js';
import { buildSystemPrompt } from '../lib/prompt.js';
import { DEFAULT_SETTINGS } from '../../shared/types.js';
import type { Citation } from '../../shared/types.js';

export const notebooksRouter = Router();

// Memory storage — Vercel serverless has a read-only filesystem, and we only
// need the buffer long enough to extract + index. Local dev uses the same path.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

notebooksRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await listNotebooks());
  } catch (err) {
    next(err);
  }
});

notebooksRouter.post('/', async (req, res, next) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title : undefined;
    const nb = await createNotebook({ title });
    res.json(nb);
  } catch (err) {
    next(err);
  }
});

notebooksRouter.get('/:id', async (req, res, next) => {
  try {
    const nb = await getNotebook(req.params.id);
    if (!nb) return res.status(404).json({ error: 'Notebook not found' });
    res.json(nb);
  } catch (err) {
    next(err);
  }
});

notebooksRouter.patch('/:id', async (req, res, next) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : undefined;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const nb = await updateNotebook(req.params.id, { title });
    if (!nb) return res.status(404).json({ error: 'Notebook not found' });
    res.json(nb);
  } catch (err) {
    next(err);
  }
});

notebooksRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteCollection(req.params.id);
    await deleteNotebook(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

notebooksRouter.post('/:id/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const id = String(req.params.id);
    const nb = await getNotebook(id);
    if (!nb) return res.status(404).json({ error: 'Notebook not found' });

    const chunkSize = num(req.body?.chunkSize, DEFAULT_SETTINGS.chunkSize);
    const chunkOverlap = num(req.body?.chunkOverlap, DEFAULT_SETTINGS.chunkOverlap);

    try {
      const source = await indexFile({
        notebookId: nb.id,
        buffer: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
        bytes: file.size,
        chunkSize,
        chunkOverlap,
      });
      res.json({ source });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      console.error('[lumen] indexFile failed:', err);
      res.status(500).json({ error: message });
    }
  } catch (err) {
    next(err);
  }
});

// Returns the page-tagged raw text for a source, used by the DocViewer.
notebooksRouter.get('/:id/sources/:sourceId/text', async (req, res, next) => {
  try {
    const nb = await getNotebook(req.params.id);
    if (!nb) return res.status(404).json({ error: 'Notebook not found' });
    const text = await getSourceText(req.params.id, req.params.sourceId);
    if (text == null) return res.status(404).json({ error: 'Source text not found' });
    res.type('text/plain').send(text);
  } catch (err) {
    next(err);
  }
});

notebooksRouter.post('/:id/chat', async (req, res) => {
  const nb = await getNotebook(req.params.id);
  if (!nb) {
    res.status(404).json({ error: 'Notebook not found' });
    return;
  }
  if (nb.sources.length === 0) {
    res.status(400).json({ error: 'This notebook has no sources yet. Upload a document first.' });
    return;
  }

  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (!query) {
    res.status(400).json({ error: 'Empty query' });
    return;
  }
  const topK = num(req.body?.topK, DEFAULT_SETTINGS.topK);

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event: object) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const queryVector = await embedQuery(query);
    const hits = await searchChunks(nb.id, queryVector, topK);

    const citations: Citation[] = hits.map((h, i) => ({
      n: i + 1,
      page: h.page,
      text: h.text,
      sourceFile: h.sourceFile,
      sourceId: h.sourceId,
      chunkIndex: h.chunkIndex,
      score: h.score,
    }));
    send({ type: 'citations', value: citations });

    if (hits.length === 0) {
      const fallback = "I don't see that in the document.";
      for (const ch of fallback) send({ type: 'token', value: ch });
      send({ type: 'done' });
      res.end();
      return;
    }

    const systemPrompt = buildSystemPrompt(hits);
    const stream = await ai.models.generateContentStream({
      model: GEN_MODEL,
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) send({ type: 'token', value: text });
    }
    await bumpAsks(nb.id).catch(() => {});
    send({ type: 'done' });
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    console.error('[lumen] chat error:', err);
    send({ type: 'error', message });
    res.end();
  }
});

function num(v: unknown, fallback: number): number {
  const raw = Array.isArray(v) ? v[0] : v;
  const n = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
