'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'open' | 'full' | 'live' | 'done' | 'stream';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'open', children, className }: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold';

  const variants = {
    open: 'bg-green-900 text-green-100 border border-green-700',
    full: 'bg-red-900 text-red-100 border border-red-700',
    live: 'bg-red-600 text-white animate-pulse border border-red-500',
    done: 'bg-blue-900 text-blue-100 border border-blue-700',
    stream: 'bg-purple-900 text-purple-100 border border-purple-700',
  };

  const icons = {
    open: '🟢',
    full: '🔴',
    live: '🔴',
    done: '✅',
    stream: '📹',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)}>
      <span>{icons[variant]}</span>
      {children}
    </span>
  );
}
