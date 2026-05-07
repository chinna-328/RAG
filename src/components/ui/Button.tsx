import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-[38px] px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2.5',
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-[#001218] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_0_1px_rgba(0,212,255,0.5),0_0_24px_rgba(0,212,255,0.45)] hover:bg-accent-hi hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_0_1px_rgba(0,212,255,0.7),0_0_32px_rgba(0,212,255,0.6)]',
  secondary:
    'bg-bg-2/80 text-fg-0 shadow-[inset_0_0_0_1px_var(--line-2),inset_0_1px_0_rgba(0,212,255,0.08)] hover:bg-bg-3/80 hover:shadow-[inset_0_0_0_1px_var(--line-3),0_0_16px_rgba(0,212,255,0.2)]',
  ghost: 'bg-transparent text-fg-1 hover:bg-bg-2/60 hover:text-accent-hi',
  outline: 'bg-transparent text-fg-0 shadow-[inset_0_0_0_1px_var(--line-3)] hover:bg-bg-2/60 hover:shadow-[inset_0_0_0_1px_var(--accent),0_0_16px_rgba(0,212,255,0.25)]',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  className,
  fullWidth,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md whitespace-nowrap font-medium',
        'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-ring',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
