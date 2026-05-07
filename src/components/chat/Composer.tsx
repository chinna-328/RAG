import { useEffect, useRef } from 'react';
import { ArrowUp, StopCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  streaming?: boolean;
  placeholder?: string;
};

export function Composer({ value, onChange, onSend, onStop, streaming, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  return (
    <div className="flex items-end gap-2 p-2.5 bg-bg-1 border border-line-2 rounded-md focus-within:border-line-3 transition-colors">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={1}
        placeholder={placeholder ?? 'Ask about this document…'}
        className="flex-1 bg-transparent border-none outline-none text-fg-0 text-sm font-sans resize-none leading-snug py-1 placeholder:text-fg-3"
      />
      {streaming ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop generation"
          className="w-8 h-8 rounded-md bg-bg-3 text-fg-1 grid place-items-center hover:bg-bg-4"
        >
          <StopCircle size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSend}
          aria-label="Send"
          disabled={!value.trim()}
          className={cn(
            'w-8 h-8 rounded-md grid place-items-center transition-colors',
            value.trim()
              ? 'bg-accent text-[#001218] hover:bg-accent-hi'
              : 'bg-bg-3 text-fg-3 cursor-not-allowed'
          )}
        >
          <ArrowUp size={14} />
        </button>
      )}
    </div>
  );
}
