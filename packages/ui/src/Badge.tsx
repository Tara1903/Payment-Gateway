import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'neutral', children, className = '', ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
    info: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
    neutral: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
    purple: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
