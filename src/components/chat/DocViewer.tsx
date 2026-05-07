import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import type { Citation, Source } from '@shared/types';

type Props = {
  notebookId: string;
  source: Source | null;
  citations: Citation[];
  highlightedCite: number | null;
  pulseCite: number | null;
  onPulseConsumed: () => void;
};

type Page = { page: number; text: string };

export function DocViewer({ notebookId, source, citations, highlightedCite, pulseCite, onPulseConsumed }: Props) {
  const [pages, setPages] = useState<Page[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!source) {
      setPages(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/notebooks/${notebookId}/sources/${source.id}/text`)
      .then((r) => {
        if (!r.ok) throw new Error('Source not found');
        return r.text();
      })
      .then((raw) => {
        if (cancelled) return;
        setPages(parsePages(raw));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? 'Failed to load source');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [source, notebookId]);

  const citesForSource = useMemo(
    () => citations.filter((c) => !source || c.sourceId === source.id),
    [citations, source]
  );

  // Scroll the highlighted citation into view when pulseCite changes.
  useEffect(() => {
    if (pulseCite == null || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-cite-mark="${pulseCite}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const t = setTimeout(onPulseConsumed, 1600);
    return () => clearTimeout(t);
  }, [pulseCite, onPulseConsumed]);

  if (!source) {
    return (
      <div className="h-full grid place-items-center text-center px-8">
        <div>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-bg-2 border border-line-2 grid place-items-center text-fg-2 mb-4">
            <FileText size={26} />
          </div>
          <h3 className="font-serif text-2xl font-normal mb-2">No document loaded</h3>
          <p className="text-fg-2 max-w-sm mx-auto">
            Upload a PDF or text file from the Sources panel to begin reading.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="h-full bg-bg-1 flex flex-col">
      <header className="px-6 py-3 border-b border-line-1 flex items-center gap-3 flex-shrink-0">
        <FileText size={16} className="text-danger" />
        <div className="flex-1 text-sm font-medium truncate">{source.filename}</div>
        <span className="text-xs text-fg-2 font-mono">{source.pages} pages · {source.chunks} chunks</span>
        <button className="w-8 h-8 grid place-items-center text-fg-2 hover:text-fg-0 hover:bg-bg-2 rounded-md" title="Find">
          <Search size={14} />
        </button>
      </header>
      <div ref={containerRef} className="flex-1 overflow-auto px-8 py-8">
        <div className="max-w-[680px] mx-auto font-serif text-[16px] leading-[1.75] text-fg-1">
          {loading && <p className="text-fg-2">Loading document…</p>}
          {error && <p className="text-danger">{error}</p>}
          {pages?.map((p) => (
            <PageBlock
              key={p.page}
              page={p}
              citations={citesForSource}
              highlightedCite={highlightedCite}
              pulseCite={pulseCite}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PageBlock({
  page,
  citations,
  highlightedCite,
  pulseCite,
}: {
  page: Page;
  citations: Citation[];
  highlightedCite: number | null;
  pulseCite: number | null;
}) {
  const onPage = citations.filter((c) => c.page === page.page);
  return (
    <div className="mb-8" data-page={page.page}>
      <div className="font-mono text-[11px] text-fg-3 uppercase tracking-wider mb-2">
        Page {page.page}
      </div>
      <div className="whitespace-pre-wrap">
        {renderWithHighlights(page.text, onPage, highlightedCite, pulseCite)}
      </div>
    </div>
  );
}

/**
 * Substring-highlight every citation snippet within the page text.
 * Citation snippets come from the same chunker as the rendered text, so a direct
 * substring match is reliable. We dedupe overlapping ranges and render in order.
 */
function renderWithHighlights(
  text: string,
  citations: Citation[],
  highlightedCite: number | null,
  pulseCite: number | null
) {
  if (citations.length === 0) return <>{text}</>;

  type Range = { start: number; end: number; n: number };
  const ranges: Range[] = [];
  for (const c of citations) {
    const needle = c.text.length > 200 ? c.text.slice(0, 200) : c.text;
    const idx = text.indexOf(needle.trim());
    if (idx === -1) {
      // try a shorter prefix
      const short = c.text.trim().slice(0, 80);
      const idx2 = text.indexOf(short);
      if (idx2 !== -1) ranges.push({ start: idx2, end: idx2 + short.length, n: c.n });
      continue;
    }
    ranges.push({ start: idx, end: idx + needle.length, n: c.n });
  }
  ranges.sort((a, b) => a.start - b.start);

  // Merge overlapping ranges, keeping the lowest n for the merged span
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }

  const out: Array<string | JSX.Element> = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) out.push(text.slice(cursor, r.start));
    const isActive = highlightedCite === r.n;
    const isPulse = pulseCite === r.n;
    out.push(
      <mark
        key={`${r.start}-${r.n}`}
        data-cite-mark={r.n}
        data-active={isActive}
        data-pulse={isPulse}
        className="citation-mark"
      >
        {text.slice(r.start, r.end)}
      </mark>
    );
    cursor = r.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return <>{out}</>;
}

function parsePages(raw: string): Page[] {
  // The indexer wrote files with a `\f[page N]\n...` separator per page.
  if (!raw.includes('\f')) {
    return [{ page: 1, text: raw }];
  }
  const parts = raw.split('\f').map((s) => s.trim()).filter(Boolean);
  return parts
    .map((part) => {
      const m = part.match(/^\[page (\d+)\]\n?([\s\S]*)$/);
      if (m) return { page: parseInt(m[1], 10), text: m[2] };
      return null;
    })
    .filter((x): x is Page => x !== null);
}
