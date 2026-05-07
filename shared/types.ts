export type Source = {
  id: string;
  filename: string;
  pages: number;
  chunks: number;
  bytes: number;
  uploadedAt: string;
};

export type Notebook = {
  id: string;
  title: string;
  emoji?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  sources: Source[];
  asks: number;
};

export type RetrievedChunk = {
  text: string;
  page: number;
  chunkIndex: number;
  sourceFile: string;
  sourceId: string;
  score: number;
};

export type Citation = {
  n: number;
  page: number;
  text: string;
  sourceFile: string;
  sourceId: string;
  chunkIndex: number;
  score: number;
};

export type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; citations?: Citation[]; pending?: boolean };

export type SSEEvent =
  | { type: 'token'; value: string }
  | { type: 'citations'; value: Citation[] }
  | { type: 'done' }
  | { type: 'error'; message: string };

export type Settings = {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  embeddingModel: string;
  generationModel: string;
};

export const DEFAULT_SETTINGS: Settings = {
  chunkSize: 1000,
  chunkOverlap: 200,
  topK: 3,
  embeddingModel: 'gemini-embedding-001',
  generationModel: 'gemini-2.5-flash',
};
