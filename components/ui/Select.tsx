'use client';

import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({
  label,
  error,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-zinc-200 mb-2">{label}</label>}
      <select
        className={cn(
          'w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100',
          'focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'appearance-none bg-no-repeat bg-right bg-[length:20px]',
          error && 'border-red-600 focus:ring-red-600/30',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
