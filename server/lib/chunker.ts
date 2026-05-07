/**
 * RecursiveCharacterTextSplitter — char-based recursive splitter that
 * matches LangChain's behavior closely enough for our pipeline.
 *
 * Strategy: try the largest separator first; if a piece is still too big,
 * recurse with the next-smaller separator. Maintains overlap by walking
 * the buffer forward by (chunkSize - overlap) chars when joining.
 */

const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

export type Chunk = {
  text: string;
  chunkIndex: number;
};

export type ChunkOptions = {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
};

export function chunkText(input: string, opts: ChunkOptions = {}): Chunk[] {
  const chunkSize = opts.chunkSize ?? 1000;
  const chunkOverlap = opts.chunkOverlap ?? 200;
  const separators = opts.separators ?? DEFAULT_SEPARATORS;

  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be less than chunkSize');
  }

  const splits = splitRecursive(input, separators, chunkSize);
  const merged = mergeSplits(splits, chunkSize, chunkOverlap);
  return merged.map((text, i) => ({ text, chunkIndex: i }));
}

function splitRecursive(text: string, separators: string[], chunkSize: number): string[] {
  if (text.length <= chunkSize) return [text];
  const [sep, ...rest] = separators;
  if (sep === undefined) return [text];

  const parts = sep === '' ? text.split('') : text.split(sep);
  const out: string[] = [];
  for (const part of parts) {
    const piece = sep === '' ? part : part;
    if (piece.length <= chunkSize) {
      out.push(piece);
    } else {
      out.push(...splitRecursive(piece, rest, chunkSize));
    }
  }
  return out.filter((s) => s.length > 0);
}

function mergeSplits(splits: string[], chunkSize: number, chunkOverlap: number): string[] {
  const out: string[] = [];
  let buffer: string[] = [];
  let bufferLen = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    out.push(buffer.join(' ').trim());
  };

  for (const s of splits) {
    const len = s.length;
    if (bufferLen + len + 1 > chunkSize && buffer.length > 0) {
      flush();
      // start next chunk with overlap from the tail
      while (bufferLen > chunkOverlap && buffer.length > 0) {
        const head = buffer[0];
        bufferLen -= head.length + 1;
        buffer.shift();
      }
    }
    buffer.push(s);
    bufferLen += len + 1;
  }
  flush();
  return out.filter((c) => c.length > 0);
}
