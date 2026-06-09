'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, MapPin } from 'lucide-react';

type Arcade = { id: string; name: string; city: string };

interface Props {
  arcades: Arcade[];
  value: string;
  onChange: (id: string) => void;
  hasError?: boolean;
}

export function ArcadeCombobox({ arcades, value, onChange, hasError }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = arcades.find((a) => a.id === value) ?? null;

  const filtered = query.trim()
    ? arcades.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.city.toLowerCase().includes(query.toLowerCase())
      )
    : arcades;

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  function select(arcade: Arcade) {
    onChange(arcade.id);
    setQuery('');
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setQuery('');
  }

  const borderClass = hasError
    ? 'border-red-500 focus-within:border-red-400'
    : 'border-zinc-700 focus-within:border-red-500';

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-zinc-800 border text-sm transition-colors cursor-text ${borderClass}`}
        onClick={() => { setOpen(true); }}
      >
        <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />

        {selected && !open ? (
          <span className="flex-1 text-zinc-100 truncate">
            {selected.name} — {selected.city}
          </span>
        ) : (
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={selected ? `${selected.name} — ${selected.city}` : 'Search for an arcade…'}
            className="flex-1 bg-transparent outline-none text-zinc-100 placeholder-zinc-600 min-w-0"
            autoComplete="off"
          />
        )}

        {selected ? (
          <button type="button" onClick={clear} className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500">No arcades found.</li>
          ) : (
            filtered.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(a); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                    a.id === value
                      ? 'bg-red-600/20 text-red-300'
                      : 'text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="font-medium">{a.name}</span>
                  <span className="text-zinc-500 text-xs ml-auto shrink-0">{a.city}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
