import type { Citation, Notebook, SSEEvent, Source } from '@shared/types';

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = String(body.error);
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function listNotebooks(): Promise<Notebook[]> {
  return jsonOrThrow(await fetch('/api/notebooks'));
}

export async function getNotebook(id: string): Promise<Notebook> {
  return jsonOrThrow(await fetch(`/api/notebooks/${id}`));
}

export async function createNotebook(title?: string): Promise<Notebook> {
  return jsonOrThrow(
    await fetch('/api/notebooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
  );
}

export async function deleteNotebook(id: string): Promise<void> {
  await jsonOrThrow(await fetch(`/api/notebooks/${id}`, { method: 'DELETE' }));
}

export async function renameNotebook(id: string, title: string): Promise<Notebook> {
  return jsonOrThrow(
    await fetch(`/api/notebooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
  );
}

export async function uploadDocument(
  notebookId: string,
  file: File,
  opts: { chunkSize?: number; chunkOverlap?: number } = {}
): Promise<{ source: Source }> {
  const fd = new FormData();
  fd.append('file', file);
  if (opts.chunkSize) fd.append('chunkSize', String(opts.chunkSize));
  if (opts.chunkOverlap) fd.append('chunkOverlap', String(opts.chunkOverlap));
  return jsonOrThrow(
    await fetch(`/api/notebooks/${notebookId}/upload`, {
      method: 'POST',
      body: fd,
    })
  );
}

export async function getHealth(): Promise<{ ok: boolean; gemini: boolean; qdrant: boolean }> {
  return jsonOrThrow(await fetch('/api/health'));
}

export type ChatStreamCallbacks = {
  onCitations?: (citations: Citation[]) => void;
  onToken?: (token: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
};

/**
 * Stream a chat completion via SSE-over-fetch. Returns an AbortController
 * the caller can use to cancel the request.
 */
export function streamChat(
  notebookId: string,
  query: string,
  topK: number,
  cb: ChatStreamCallbacks
): AbortController {
  const ac = new AbortController();
  (async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          // ignore
        }
        cb.onError?.(msg);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const line = raw.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          try {
            const event = JSON.parse(json) as SSEEvent;
            if (event.type === 'token') cb.onToken?.(event.value);
            else if (event.type === 'citations') cb.onCitations?.(event.value);
            else if (event.type === 'done') cb.onDone?.();
            else if (event.type === 'error') cb.onError?.(event.message);
          } catch {
            // ignore malformed event
          }
        }
      }
      cb.onDone?.();
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      cb.onError?.(err instanceof Error ? err.message : 'Network error');
    }
  })();
  return ac;
}
