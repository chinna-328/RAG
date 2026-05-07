/**
 * Document text extraction. Produces page-tagged segments so chunks can carry
 * a stable page number into Qdrant.
 *
 * For PDFs we use pdf-parse and split on the form-feed (\f) marker that
 * pdf-parse inserts between pages — the documented behavior of the library.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// pdf-parse ships as CJS and tries to read a sample PDF when imported via its
// index entry — load the inner module to avoid that.
type PdfParseFn = (data: Buffer) => Promise<{ text: string; numpages: number }>;
const pdfParse: PdfParseFn = require('pdf-parse/lib/pdf-parse.js');

export type PageText = {
  page: number; // 1-indexed
  text: string;
};

export async function extractPdf(buffer: Buffer): Promise<PageText[]> {
  const result = await pdfParse(buffer);
  const text = result.text ?? '';
  if (!text.trim()) return [];
  // pdf-parse separates pages with a form feed. Fall back to one big page.
  const parts = text.split(/\f/);
  const pages: PageText[] = parts
    .map((t, i) => ({ page: i + 1, text: t.trim() }))
    .filter((p) => p.text.length > 0);
  if (pages.length === 0) return [{ page: 1, text: text.trim() }];
  return pages;
}

export function extractPlain(buffer: Buffer): PageText[] {
  const text = buffer.toString('utf8').trim();
  if (!text) return [];
  // Treat each ~3000 chars as a "page" so very long .txt files still get
  // useful page numbers in citations. Keeps natural paragraph boundaries.
  const PAGE_CHARS = 3000;
  if (text.length <= PAGE_CHARS) return [{ page: 1, text }];
  const out: PageText[] = [];
  let cursor = 0;
  let page = 1;
  while (cursor < text.length) {
    let end = Math.min(cursor + PAGE_CHARS, text.length);
    if (end < text.length) {
      // backtrack to nearest paragraph break for cleanliness
      const para = text.lastIndexOf('\n\n', end);
      if (para > cursor + PAGE_CHARS / 2) end = para;
    }
    out.push({ page, text: text.slice(cursor, end).trim() });
    cursor = end;
    page += 1;
  }
  return out.filter((p) => p.text.length > 0);
}
