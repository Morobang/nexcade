'use client';

import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function Loader({ size = 'md', text, className }: LoaderProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          'relative border-3 border-zinc-700 border-t-red-600 rounded-full animate-spin',
          sizes[size],
          className
        )}
      />
      {text && <p className="text-zinc-400 text-sm">{text}</p>}
    </div>
  );
}

export function FullPageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        <p className="text-zinc-300 text-lg">{text}</p>
      </div>
    </div>
  );
}
