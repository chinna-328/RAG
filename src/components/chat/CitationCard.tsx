import type { Citation } from '@shared/types';
import { cn } from '@/lib/cn';

export function CitationCard({
  c,
  active,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  c: Citation;
  active?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        'flex gap-2 p-2.5 rounded-md border text-left w-full transition-colors',
        active ? 'bg-bg-3 border-line-3' : 'bg-bg-1 border-line-1 hover:bg-bg-2'
      )}
    >
      <span className="font-mono text-[10px] font-semibold text-accent-hi pt-0.5 flex-shrink-0">
        [{c.n}]
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[11px] text-fg-2 mb-0.5">
          page {c.page} · score {c.score.toFixed(2)}
        </div>
        <div
          className="text-xs text-fg-1 leading-relaxed overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {c.text}
        </div>
      </div>
    </button>
  );
}
