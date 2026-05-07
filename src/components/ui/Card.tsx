import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hover?: boolean;
  dashed?: boolean;
  iso?: boolean;
  glow?: 'cyan' | 'green' | 'none';
};

export function Card({
  children,
  hover,
  dashed,
  iso,
  glow = 'cyan',
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-bg-1/80 backdrop-blur-sm rounded-lg transition-all duration-300',
        dashed
          ? 'border-2 border-dashed border-line-2'
          : 'border border-line-2',
        glow === 'cyan' && 'neon-edge',
        glow === 'green' && 'neon-edge-green',
        iso && 'iso-panel',
        hover && 'cursor-pointer hover:bg-bg-2/80 hover:border-line-3',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
