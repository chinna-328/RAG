import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  // We don't throw at import time so the server can boot for static UI work,
  // but every API route that calls Gemini will assert the key.
  console.warn('[lumen] GEMINI_API_KEY is not set — chat and indexing will fail until you add it to .env');
}

export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? 'gemini-embedding-001';
export const GEN_MODEL = process.env.GEMINI_GEN_MODEL ?? 'gemini-2.5-flash';
export const EMBED_DIMS = 768;

export const ai = new GoogleGenAI({ apiKey: apiKey ?? '' });

export function assertGemini(): void {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to .env and restart the server.');
  }
}

// gemini-embedding-2 returns a single aggregated embedding when given multiple
// inputs, so we call once per string to get one vector per input across models.
export async function embedTexts(texts: string[]): Promise<number[][]> {
  assertGemini();
  if (texts.length === 0) return [];
  const out: number[][] = [];
  for (const text of texts) {
    const res = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: text,
      config: { outputDimensionality: EMBED_DIMS },
    });
    const values = res.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      throw new Error('Gemini returned an empty embedding vector.');
    }
    out.push(values);
  }
  return out;
}

export async function embedQuery(query: string): Promise<number[]> {
  const [v] = await embedTexts([query]);
  return v;
}
