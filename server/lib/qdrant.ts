import { QdrantClient } from '@qdrant/js-client-rest';
import { EMBED_DIMS } from './gemini.js';

const url = process.env.QDRANT_URL;
const apiKey = process.env.QDRANT_API_KEY;

if (!url) {
  console.warn('[lumen] QDRANT_URL is not set — indexing and retrieval will fail until you add it to .env');
}

export const qdrant = new QdrantClient({
  url: url ?? 'http://localhost:6333',
  apiKey: apiKey || undefined,
  checkCompatibility: false,
});

export function assertQdrant(): void {
  if (!url) {
    throw new Error('QDRANT_URL is not configured. Add it to .env and restart the server.');
  }
}

export function collectionFor(notebookId: string): string {
  // Qdrant collection names: alphanumerics + dashes/underscores
  return `lumen_${notebookId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export const NOTEBOOKS_COLLECTION = 'lumen_notebooks';

export async function ensureNotebooksCollection(): Promise<void> {
  assertQdrant();
  const exists = await qdrant.collectionExists(NOTEBOOKS_COLLECTION);
  if (exists.exists) return;
  // We never search by similarity here — Qdrant just requires *some* vector.
  await qdrant.createCollection(NOTEBOOKS_COLLECTION, {
    vectors: { size: 1, distance: 'Cosine' },
  });
}

export async function ensureCollection(notebookId: string): Promise<void> {
  assertQdrant();
  const name = collectionFor(notebookId);
  const exists = await qdrant.collectionExists(name);
  if (!exists.exists) {
    await qdrant.createCollection(name, {
      vectors: { size: EMBED_DIMS, distance: 'Cosine' },
    });
  }
  // Qdrant requires a payload index before you can filter on a field.
  // Idempotent — succeeds quietly if the index already exists.
  await qdrant
    .createPayloadIndex(name, { field_name: 'kind', field_schema: 'keyword', wait: true })
    .catch(() => {});
}

export async function deleteCollection(notebookId: string): Promise<void> {
  const name = collectionFor(notebookId);
  try {
    await qdrant.deleteCollection(name);
  } catch {
    // ignore — collection may not exist
  }
}

export type ChunkPayload = {
  kind?: 'chunk' | 'source_text';
  text: string;
  page: number;
  chunkIndex: number;
  sourceFile: string;
  sourceId: string;
};

export type UpsertPoint = {
  id: string;
  vector: number[];
  payload: ChunkPayload;
};

export async function upsertChunks(notebookId: string, points: UpsertPoint[]): Promise<void> {
  if (points.length === 0) return;
  assertQdrant();
  const name = collectionFor(notebookId);
  await qdrant.upsert(name, {
    wait: true,
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: { kind: 'chunk', ...p.payload },
    })),
  });
}

export type Hit = ChunkPayload & { score: number };

export async function searchChunks(
  notebookId: string,
  vector: number[],
  k: number
): Promise<Hit[]> {
  assertQdrant();
  const name = collectionFor(notebookId);
  // Idempotent — guarantees the `kind` payload index exists for pre-existing
  // collections that were created before this filter was introduced.
  await ensureCollection(notebookId);
  const result = await qdrant.search(name, {
    vector,
    limit: k,
    with_payload: true,
    filter: {
      must_not: [{ key: 'kind', match: { value: 'source_text' } }],
    },
  });
  return result.map((r) => ({
    text: String(r.payload?.text ?? ''),
    page: Number(r.payload?.page ?? 0),
    chunkIndex: Number(r.payload?.chunkIndex ?? 0),
    sourceFile: String(r.payload?.sourceFile ?? ''),
    sourceId: String(r.payload?.sourceId ?? ''),
    score: r.score,
  }));
}

// --- Source text storage (page-tagged raw text per uploaded source) -----------
// Stored as a payload-only point in the per-notebook chunks collection. The
// vector is a zeros placeholder (vectors are required by Qdrant) and the
// `kind: 'source_text'` filter keeps these points out of similarity search.

export async function upsertSourceText(
  notebookId: string,
  sourceId: string,
  sourceFile: string,
  text: string
): Promise<void> {
  assertQdrant();
  const name = collectionFor(notebookId);
  await qdrant.upsert(name, {
    wait: true,
    points: [
      {
        id: sourceTextPointId(sourceId),
        vector: new Array(EMBED_DIMS).fill(0),
        payload: {
          kind: 'source_text',
          sourceId,
          sourceFile,
          text,
          page: 0,
          chunkIndex: -1,
        },
      },
    ],
  });
}

export async function getSourceText(
  notebookId: string,
  sourceId: string
): Promise<string | null> {
  assertQdrant();
  const name = collectionFor(notebookId);
  const result = await qdrant.retrieve(name, {
    ids: [sourceTextPointId(sourceId)],
    with_payload: true,
    with_vector: false,
  });
  const point = result[0];
  if (!point) return null;
  const text = point.payload?.text;
  return typeof text === 'string' ? text : null;
}

// Deterministic UUIDv5-ish id derived from sourceId so we can retrieve directly.
// Qdrant accepts either a UUID string or unsigned integer; we use a UUIDv4-shape
// derived from the sourceId so the id is stable across calls.
function sourceTextPointId(sourceId: string): string {
  // Reuse the sourceId UUID directly — but flip the version nibble to 5 to avoid
  // colliding with any chunk that ever shared the same id (chunks use random v4).
  // Format: xxxxxxxx-xxxx-Mxxx-xxxx-xxxxxxxxxxxx where M is the version nibble.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sourceId)) {
    return sourceId.slice(0, 14) + '5' + sourceId.slice(15);
  }
  return sourceId;
}
