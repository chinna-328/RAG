import { cn } from '@/lib/cn';

export function Avatar({
  name = 'You',
  size = 28,
  accent = false,
  className,
}: {
  name?: string;
  size?: number;
  accent?: boolean;
  className?: string;
}) {
  const initial = name[0]?.toUpperCase() || '?';
  return (
    <div
      className={cn(
        'rounded-full grid place-items-center font-semibold flex-shrink-0',
        accent
          ? 'text-[#001218] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
          : 'bg-bg-3 text-fg-0 shadow-[inset_0_0_0_1px_var(--line-2)]',
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: accent ? 'linear-gradient(135deg, var(--accent), var(--accent-lo))' : undefined,
      }}
    >
      {initial}
    </div>
  );
}
