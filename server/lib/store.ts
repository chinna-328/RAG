/**
 * Notebook metadata store backed by a dedicated Qdrant collection
 * (`lumen_notebooks`). Each notebook is stored as a single point: id =
 * notebook UUID, vector = [0] (Qdrant requires a vector but we never search
 * by it), payload = full Notebook object.
 *
 * This replaces the JSON-file store so the API can run on read-only
 * filesystems (Vercel serverless).
 */
import { v4 as uuid } from 'uuid';
import type { Notebook, Source } from '../../shared/types.js';
import {
  qdrant,
  assertQdrant,
  ensureNotebooksCollection,
  NOTEBOOKS_COLLECTION,
} from './qdrant.js';

const PALETTE = ['#5fcf94', '#6aa9ff', '#f5b544', '#c98ef0', '#f06464', '#5fcfd2'];

async function readAll(): Promise<Notebook[]> {
  assertQdrant();
  await ensureNotebooksCollection();
  const out: Notebook[] = [];
  let offset: string | number | Record<string, unknown> | undefined = undefined;
  // Scroll through all notebooks. For an assignment-scale workload the
  // page size of 256 is plenty.
  while (true) {
    const page = await qdrant.scroll(NOTEBOOKS_COLLECTION, {
      limit: 256,
      offset,
      with_payload: true,
      with_vector: false,
    });
    for (const p of page.points) {
      const nb = p.payload as unknown as Notebook | null;
      if (nb && typeof nb === 'object' && typeof nb.id === 'string') out.push(nb);
    }
    if (page.next_page_offset == null) break;
    offset = page.next_page_offset;
  }
  return out;
}

async function writeOne(nb: Notebook): Promise<void> {
  assertQdrant();
  await ensureNotebooksCollection();
  await qdrant.upsert(NOTEBOOKS_COLLECTION, {
    wait: true,
    points: [
      {
        id: nb.id,
        vector: [0],
        payload: nb as unknown as Record<string, unknown>,
      },
    ],
  });
}

async function deleteOne(id: string): Promise<void> {
  assertQdrant();
  await ensureNotebooksCollection();
  await qdrant.delete(NOTEBOOKS_COLLECTION, { wait: true, points: [id] });
}

export async function listNotebooks(): Promise<Notebook[]> {
  const all = await readAll();
  return [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getNotebook(id: string): Promise<Notebook | null> {
  assertQdrant();
  await ensureNotebooksCollection();
  const result = await qdrant.retrieve(NOTEBOOKS_COLLECTION, {
    ids: [id],
    with_payload: true,
    with_vector: false,
  });
  const point = result[0];
  if (!point) return null;
  const nb = point.payload as unknown as Notebook | null;
  return nb && typeof nb === 'object' ? nb : null;
}

export async function createNotebook(input: { title?: string }): Promise<Notebook> {
  const all = await readAll();
  const now = new Date().toISOString();
  const nb: Notebook = {
    id: uuid(),
    title: input.title?.trim() || 'Untitled notebook',
    color: PALETTE[all.length % PALETTE.length],
    createdAt: now,
    updatedAt: now,
    sources: [],
    asks: 0,
  };
  await writeOne(nb);
  return nb;
}

export async function updateNotebook(
  id: string,
  patch: Partial<Pick<Notebook, 'title' | 'asks'>>
): Promise<Notebook | null> {
  const current = await getNotebook(id);
  if (!current) return null;
  const updated: Notebook = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeOne(updated);
  return updated;
}

export async function addSource(notebookId: string, source: Source): Promise<void> {
  const current = await getNotebook(notebookId);
  if (!current) throw new Error('notebook not found');
  const updated: Notebook = {
    ...current,
    sources: [...current.sources, source],
    updatedAt: new Date().toISOString(),
  };
  await writeOne(updated);
}

export async function bumpAsks(notebookId: string): Promise<void> {
  const current = await getNotebook(notebookId);
  if (!current) return;
  await writeOne({
    ...current,
    asks: current.asks + 1,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteNotebook(id: string): Promise<void> {
  await deleteOne(id);
}
