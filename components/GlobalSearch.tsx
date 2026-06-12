'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Search, X, Trophy, Building2, User, Loader2 } from 'lucide-react';

type ResultType = 'tournament' | 'arcade' | 'player';

type SearchResult = {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  href: string;
  meta?: string;
};

const GROUP_LABELS: Record<ResultType, string> = {
  tournament: 'Tournaments',
  arcade: 'Arcades',
  player: 'Players',
};

const GROUP_ICONS: Record<ResultType, React.ElementType> = {
  tournament: Trophy,
  arcade: Building2,
  player: User,
};

// ── Trigger button (shown in navbar when modal is closed) ────────────────────

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-fg-3 hover:text-fg hover:bg-elevated transition-colors"
      aria-label="Open search"
    >
      <Search className="w-4 h-4 shrink-0" />
      <span className="hidden lg:inline text-sm">Search</span>
      <kbd className="hidden lg:inline text-[10px] bg-elevated px-1.5 py-0.5 rounded border border-stroke font-mono leading-none">
        Ctrl K
      </kbd>
    </button>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);

  // Focus + reset when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const q = `%${query}%`;
      const [{ data: ts }, { data: as_ }, { data: ps }] = await Promise.all([
        supabase
          .from('tournaments')
          .select('id, name, slug, game_type, status, arcades(city)')
          .or(`name.ilike.${q},game_type.ilike.${q}`)
          .neq('status', 'cancelled')
          .limit(5),
        supabase
          .from('arcades')
          .select('id, name, slug, city')
          .or(`name.ilike.${q},city.ilike.${q}`)
          .eq('is_active', true)
          .limit(5),
        supabase
          .from('profiles')
          .select('id, gamer_tag, full_name')
          .or(`gamer_tag.ilike.${q},full_name.ilike.${q}`)
          .limit(5),
      ]);

      const mapped: SearchResult[] = [
        ...(ts ?? []).map((t) => ({
          id: t.id,
          type: 'tournament' as const,
          title: t.name,
          subtitle: `${t.game_type}${(t.arcades as any)?.city ? ' · ' + (t.arcades as any).city : ''}`,
          href: `/tournaments/${t.slug}`,
          meta: t.status,
        })),
        ...(as_ ?? []).map((a) => ({
          id: a.id,
          type: 'arcade' as const,
          title: a.name,
          subtitle: a.city,
          href: `/arcades/${a.slug}`,
        })),
        ...(ps ?? []).map((p) => ({
          id: p.id,
          type: 'player' as const,
          title: p.gamer_tag,
          subtitle: p.full_name,
          href: `/profile/${p.id}`,
        })),
      ];

      setResults(mapped);
      setSelected(0);
      setLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      router.push(results[selected].href);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-[2001]">
        <div className="bg-surface border border-stroke rounded-2xl shadow-2xl overflow-hidden">

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stroke">
            {loading
              ? <Loader2 className="w-4 h-4 text-fg-3 shrink-0 animate-spin" />
              : <Search className="w-4 h-4 text-fg-3 shrink-0" />
            }
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tournaments, arcades, players…"
              className="flex-1 bg-transparent text-fg placeholder:text-fg-3 text-sm outline-none"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="text-fg-3 hover:text-fg transition-colors">
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="text-[10px] text-fg-3 bg-elevated px-1.5 py-0.5 rounded border border-stroke font-mono shrink-0">
                Esc
              </kbd>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <ul className="max-h-[340px] overflow-y-auto py-2">
              {(['tournament', 'arcade', 'player'] as ResultType[]).map((type) => {
                const group = results.filter((r) => r.type === type);
                if (!group.length) return null;
                const Icon = GROUP_ICONS[type];
                return (
                  <li key={type}>
                    <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-fg-3 uppercase tracking-widest">
                      {GROUP_LABELS[type]}
                    </p>
                    {group.map((result) => {
                      const idx = results.indexOf(result);
                      const active = idx === selected;
                      return (
                        <Link
                          key={result.id}
                          href={result.href}
                          onClick={onClose}
                          onMouseEnter={() => setSelected(idx)}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                            active ? 'bg-elevated' : 'hover:bg-elevated'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-fg-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-fg text-sm font-semibold truncate">{result.title}</p>
                            <p className="text-fg-3 text-xs truncate">{result.subtitle}</p>
                          </div>
                          {result.meta && (
                            <span className="text-[10px] text-fg-3 bg-elevated border border-stroke px-2 py-0.5 rounded-full capitalize shrink-0">
                              {result.meta}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </li>
                );
              })}
            </ul>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-fg-3 text-sm">
                No results for <span className="text-fg font-semibold">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
          )}

          {/* Keyboard hint */}
          {query.length < 2 && (
            <div className="px-4 py-3 flex items-center gap-4 text-[10px] text-fg-3 border-t border-stroke">
              <span className="flex items-center gap-1">
                <kbd className="bg-elevated px-1.5 py-0.5 rounded border border-stroke font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-elevated px-1.5 py-0.5 rounded border border-stroke font-mono">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-elevated px-1.5 py-0.5 rounded border border-stroke font-mono">Esc</kbd>
                close
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
