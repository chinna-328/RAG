import { Check, FileText, Plus } from 'lucide-react';
import type { Citation, Notebook, Source } from '@shared/types';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type Props = {
  notebook: Notebook;
  activeSourceId: string | null;
  setActiveSourceId: (id: string) => void;
  citations: Citation[];
  highlightedCite: number | null;
  setHighlightedCite: (n: number | null) => void;
  onCiteClick: (c: Citation) => void;
  onAddSource: () => void;
};

export function SourcesPanel({
  notebook,
  activeSourceId,
  setActiveSourceId,
  citations,
  highlightedCite,
  setHighlightedCite,
  onCiteClick,
  onAddSource,
}: Props) {
  return (
    <aside className="bg-bg-0 border-r border-line-1 flex flex-col overflow-hidden">
      <div className="p-5 pb-3">
        <div className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.08em] mb-3">
          Sources
        </div>
        <div className="flex flex-col gap-1.5">
          {notebook.sources.length === 0 && (
            <div className="text-xs text-fg-2 px-1 py-2 leading-relaxed">
              No sources yet. Add one to start asking questions.
            </div>
          )}
          {notebook.sources.map((s) => (
            <SourceRow
              key={s.id}
              source={s}
              active={s.id === activeSourceId}
              onClick={() => setActiveSourceId(s.id)}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onAddSource}
          className="mt-2 w-full justify-start"
        >
          Add source
        </Button>
      </div>

      <div className="border-t border-line-1 px-5 py-3 flex-1 overflow-auto">
        <div className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.08em] mb-3">
          Retrieved chunks
        </div>
        {citations.length === 0 ? (
          <div className="text-xs text-fg-3 px-1 leading-relaxed">
            Ask a question to see the chunks Lumen used to answer.
          </div>
        ) : (
          citations.map((c) => (
            <button
              type="button"
              key={c.n}
              onMouseEnter={() => setHighlightedCite(c.n)}
              onMouseLeave={() => setHighlightedCite(null)}
              onClick={() => onCiteClick(c)}
              className={cn(
                'w-full text-left p-2.5 mb-2 bg-bg-1 border border-line-1 rounded-md transition-colors',
                highlightedCite === c.n && 'bg-bg-2 border-line-3'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-fg-2 font-mono">
                  [{c.n}] · p.{c.page}
                </span>
                <span className="text-[11px] text-accent font-mono">
                  {c.score.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-fg-1 leading-relaxed line-clamp-3">
                {c.text}
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

function SourceRow({
  source,
  active,
  onClick,
}: {
  source: Source;
  active?: boolean;
  onClick?: () => void;
}) {
  const isPdf = source.filename.toLowerCase().endsWith('.pdf');
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 p-2.5 rounded-md border transition-colors text-left',
        active
          ? 'bg-bg-2 border-line-3'
          : 'bg-bg-1 border-line-1 hover:bg-bg-2'
      )}
    >
      <div
        className={cn(
          'w-7 h-7 rounded-md grid place-items-center flex-shrink-0',
          isPdf
            ? 'bg-[rgba(255,59,107,0.14)] border border-[rgba(255,59,107,0.4)] text-danger shadow-[0_0_10px_rgba(255,59,107,0.25)]'
            : 'bg-[rgba(0,212,255,0.14)] border border-[rgba(0,212,255,0.4)] text-info shadow-[0_0_10px_rgba(0,212,255,0.25)]'
        )}
      >
        <FileText size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{source.filename}</div>
        <div className="text-[11px] text-fg-2">
          {source.pages} pages · {source.chunks} chunks
        </div>
      </div>
      <Check size={14} className="text-success flex-shrink-0" />
    </button>
  );
}
