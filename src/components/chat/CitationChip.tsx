import { cn } from '@/lib/cn';

export function CitationChip({
  n,
  active,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  n: number;
  active?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}) {
  return (
    <sup
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center align-super',
        'min-w-[18px] h-[18px] px-1 mx-0.5 rounded-[4px]',
        'font-mono text-[10px] font-semibold leading-none cursor-pointer',
        'transition-colors duration-150',
        active
          ? 'bg-[rgba(0,255,157,0.5)] text-neon-hi shadow-[0_0_12px_rgba(0,255,157,0.5)]'
          : 'bg-[rgba(0,255,157,0.18)] text-neon-hi hover:bg-[rgba(0,255,157,0.32)] hover:shadow-[0_0_8px_rgba(0,255,157,0.4)]'
      )}
    >
      {n}
    </sup>
  );
}
