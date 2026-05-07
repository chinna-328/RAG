import { Sparkles, Copy, RefreshCcw } from 'lucide-react';
import type { Citation } from '@shared/types';

import { CitationChip } from './CitationChip';
import { CitationCard } from './CitationCard';

type Props = {
  text: string;
  pending?: boolean;
  citations?: Citation[];
  highlightedCite: number | null;
  setHighlightedCite: (n: number | null) => void;
  onCiteClick?: (c: Citation) => void;
};

export function AssistantMessage({
  text,
  pending,
  citations,
  highlightedCite,
  setHighlightedCite,
  onCiteClick,
}: Props) {
  const handleCopy = () => navigator.clipboard.writeText(text).catch(() => {});

  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-7 h-7 rounded-md bg-bg-2 border border-line-2 grid place-items-center flex-shrink-0 text-accent">
        <Sparkles size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm leading-[1.65] text-fg-0 whitespace-pre-wrap break-words">
          {renderWithCitations(text, citations ?? [], highlightedCite, setHighlightedCite, onCiteClick)}
          {pending && <span className="inline-block w-2 h-4 ml-0.5 bg-accent align-middle animate-blink" />}
        </div>
        {citations && citations.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {citations.map((c) => (
              <CitationCard
                key={c.n}
                c={c}
                active={highlightedCite === c.n}
                onMouseEnter={() => setHighlightedCite(c.n)}
                onMouseLeave={() => setHighlightedCite(null)}
                onClick={() => onCiteClick?.(c)}
              />
            ))}
          </div>
        )}
        {!pending && text && (
          <div className="flex gap-1 mt-2 opacity-70">
            <button
              type="button"
              onClick={handleCopy}
              className="w-7 h-7 rounded-md grid place-items-center text-fg-2 hover:text-fg-0 hover:bg-bg-2"
              title="Copy"
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              className="w-7 h-7 rounded-md grid place-items-center text-fg-2 hover:text-fg-0 hover:bg-bg-2"
              title="Regenerate (not yet wired)"
            >
              <RefreshCcw size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function renderWithCitations(
  text: string,
  citations: Citation[],
  highlightedCite: number | null,
  setHighlightedCite: (n: number | null) => void,
  onCiteClick?: (c: Citation) => void
) {
  // Split on bracketed indexes [1], [12], etc. Keep consecutive citations like [1][2] separate.
  const parts = text.split(/(\[\d{1,2}\])/g);
  return parts.map((part, j) => {
    const m = part.match(/^\[(\d{1,2})\]$/);
    if (m) {
      const n = parseInt(m[1], 10);
      const cite = citations.find((c) => c.n === n);
      if (!cite) return <span key={j}>{part}</span>;
      return (
        <CitationChip
          key={j}
          n={n}
          active={highlightedCite === n}
          onMouseEnter={() => setHighlightedCite(n)}
          onMouseLeave={() => setHighlightedCite(null)}
          onClick={() => onCiteClick?.(cite)}
        />
      );
    }
    return <span key={j}>{part}</span>;
  });
}
