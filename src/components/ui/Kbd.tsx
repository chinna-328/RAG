import type { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bg-2 text-fg-1 border border-line-2 shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)]">
      {children}
    </kbd>
  );
}
