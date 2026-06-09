'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

const GAMES = ['FC26', 'Tekken8', 'SF6', 'MK1', 'KOFXV', 'Naruto'];

interface Props {
  arcades: { id: string; name: string; city: string }[];
  seasons: string[];
  activeGame?: string;
  activeArcade?: string;
  activeSeason?: string;
  activeSearch?: string;
}

export function LeaderboardFilters({ arcades, seasons, activeGame, activeArcade, activeSeason, activeSearch }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search player…"
          defaultValue={activeSearch ?? ''}
          onChange={(e) => update('search', e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg pl-9 pr-3 py-2 w-48 focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
        />
      </div>

      <select
        value={activeGame ?? ''}
        onChange={(e) => update('game', e.target.value)}
        className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
      >
        <option value="">All games</option>
        {GAMES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <select
        value={activeArcade ?? ''}
        onChange={(e) => update('arcade', e.target.value)}
        className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
      >
        <option value="">All arcades</option>
        {arcades.map((a) => (
          <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
        ))}
      </select>

      {seasons.length > 0 && (
        <select
          value={activeSeason ?? ''}
          onChange={(e) => update('season', e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
        >
          <option value="">All seasons</option>
          {seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      {(activeGame || activeArcade || activeSeason || activeSearch) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
