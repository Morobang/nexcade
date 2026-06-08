'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'fire' | 'ghost' | 'outline' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export function Button({
  variant = 'fire',
  size = 'md',
  className,
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    fire: 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-lg hover:shadow-red-500/50',
    ghost: 'bg-transparent text-zinc-200 hover:bg-zinc-800 border border-zinc-700',
    outline: 'border-2 border-zinc-600 text-zinc-200 hover:border-zinc-400 hover:bg-zinc-900',
    gold: 'bg-yellow-500 text-black hover:bg-yellow-400 font-bold shadow-lg hover:shadow-yellow-500/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="animate-spin">⏳</span>}
      {children}
    </button>
  );
}
