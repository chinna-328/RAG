import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'accent' | 'success' | 'info' | 'danger';

const variantClasses: Record<Variant, string> = {
  default: 'bg-bg-2/60 text-fg-1 border border-line-2',
  accent: 'bg-[rgba(0,212,255,0.10)] text-accent-hi border border-[rgba(0,212,255,0.4)] shadow-[0_0_12px_rgba(0,212,255,0.25)]',
  success: 'bg-[rgba(0,255,157,0.10)] text-neon-hi border border-[rgba(0,255,157,0.4)] shadow-[0_0_12px_rgba(0,255,157,0.25)]',
  info: 'bg-[rgba(0,212,255,0.10)] text-accent-hi border border-[rgba(0,212,255,0.35)]',
  danger: 'bg-[rgba(255,59,107,0.10)] text-danger border border-[rgba(255,59,107,0.4)] shadow-[0_0_12px_rgba(255,59,107,0.2)]',
};

export function Badge({
  children,
  variant = 'default',
  icon,
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
