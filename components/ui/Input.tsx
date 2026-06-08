'use client';

import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-zinc-200 mb-2">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500',
          'focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-600 focus:ring-red-600/30',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
