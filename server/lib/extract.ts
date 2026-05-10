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

export function extractCsv(buffer: Buffer): PageText[] {
  const text = buffer.toString('utf8').replace(/^﻿/, '');
  if (!text.trim()) return [];
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const [header, ...body] = rows;
  if (body.length === 0) {
    // Header-only file — still index it so users can ask about column names.
    return [{ page: 1, text: formatRow(header) }];
  }

  // Group ~50 rows per page so citations point at a useful slice. Keep the
  // header at the top of every page so each chunk reads as labelled records.
  const ROWS_PER_PAGE = 50;
  const pages: PageText[] = [];
  for (let i = 0; i < body.length; i += ROWS_PER_PAGE) {
    const slice = body.slice(i, i + ROWS_PER_PAGE);
    const lines = [formatRow(header), ...slice.map(formatRow)];
    pages.push({ page: pages.length + 1, text: lines.join('\n') });
  }
  return pages;
}

// Minimal RFC-4180 parser: handles quoted fields, escaped quotes (""),
// commas and newlines inside quotes, and CRLF line endings.
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      row.push(field);
      field = '';
      // Skip the \n in a \r\n pair.
      if (c === '\r' && input[i + 1] === '\n') i += 1;
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  // Flush trailing field/row (file without final newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }
  return rows;
}

function formatRow(cells: string[]): string {
  // Collapse internal whitespace per cell so a single row stays on one line —
  // chunkers treat newlines as paragraph boundaries.
  return cells.map((c) => c.replace(/\s+/g, ' ').trim()).join(' | ');
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
