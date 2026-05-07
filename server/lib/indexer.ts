import { v4 as uuid } from 'uuid';
import type { Source } from '../../shared/types.js';
import { chunkText } from './chunker.js';
import { embedTexts } from './gemini.js';
import { ensureCollection, upsertChunks, upsertSourceText } from './qdrant.js';
import { extractPdf, extractPlain } from './extract.js';
import { addSource } from './store.js';

export type IndexParams = {
  notebookId: string;
  buffer: Buffer;
  filename: string;
  mimetype: string;
  bytes: number;
  chunkSize: number;
  chunkOverlap: number;
};

export async function indexFile(params: IndexParams): Promise<Source> {
  const { notebookId, buffer, filename, mimetype, bytes, chunkSize, chunkOverlap } = params;

  const isPdf = mimetype === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
  const pages = isPdf ? await extractPdf(buffer) : extractPlain(buffer);

  if (pages.length === 0 || pages.every((p) => !p.text.trim())) {
    throw new Error('Could not extract text from this file.');
  }

  const sourceId = uuid();
  const sourceFile = filename;

  // Chunk per-page so we keep an honest page number on every chunk.
  const allChunks: Array<{
    text: string;
    page: number;
    chunkIndex: number;
  }> = [];
  let runningIndex = 0;
  for (const p of pages) {
    const cs = chunkText(p.text, { chunkSize, chunkOverlap });
    for (const c of cs) {
      allChunks.push({ text: c.text, page: p.page, chunkIndex: runningIndex });
      runningIndex += 1;
    }
  }

  if (allChunks.length === 0) {
    throw new Error('Document produced 0 chunks. Try a different file.');
  }

  await ensureCollection(notebookId);
  const vectors = await embedTexts(allChunks.map((c) => c.text));

  await upsertChunks(
    notebookId,
    allChunks.map((c, i) => ({
      id: uuid(),
      vector: vectors[i],
      payload: {
        text: c.text,
        page: c.page,
        chunkIndex: c.chunkIndex,
        sourceFile,
        sourceId,
      },
    }))
  );

  // Persist a copy of the page-tagged raw text for the doc viewer. Stored as a
  // payload-only point in the same Qdrant collection so we don't depend on a
  // local filesystem (Vercel serverless is read-only).
  const sourceText = pages.map((p) => `\f[page ${p.page}]\n${p.text}`).join('\n\n');
  await upsertSourceText(notebookId, sourceId, sourceFile, sourceText);

  const source: Source = {
    id: sourceId,
    filename,
    pages: pages.length,
    chunks: allChunks.length,
    bytes,
    uploadedAt: new Date().toISOString(),
  };
  await addSource(notebookId, source);
  return source;
}
