'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  games: FilterOption[];
  arcades: FilterOption[];
  cities: FilterOption[];
}

const STATUSES: FilterOption[] = [
  { value: '', label: 'All Status' },
  { value: 'live', label: 'Live Now' },
  { value: 'open', label: 'Open' },
  { value: 'full', label: 'Full' },
  { value: 'completed', label: 'Completed' },
];

export function TournamentFilters({ games, arcades, cities }: Props) {
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

  const current = {
    game: searchParams.get('game') ?? '',
    status: searchParams.get('status') ?? '',
    arcade: searchParams.get('arcade') ?? '',
    city: searchParams.get('city') ?? '',
  };

  const hasFilters = Object.values(current).some(Boolean);

  const selectClass =
    'bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-600 transition-colors cursor-pointer';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SlidersHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />

      <select
        value={current.game}
        onChange={(e) => update('game', e.target.value)}
        className={selectClass}
      >
        {games.map((g) => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>

      <select
        value={current.status}
        onChange={(e) => update('status', e.target.value)}
        className={selectClass}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        value={current.city}
        onChange={(e) => update('city', e.target.value)}
        className={selectClass}
      >
        {cities.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <select
        value={current.arcade}
        onChange={(e) => update('arcade', e.target.value)}
        className={selectClass}
      >
        {arcades.map((a) => (
          <option key={a.value} value={a.value}>{a.label}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
