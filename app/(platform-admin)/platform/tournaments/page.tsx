'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loader2, AlertCircle, Gamepad2 } from 'lucide-react';

type TournamentRow = {
  id: string;
  slug: string;
  name: string;
  game_type: string;
  status: string;
  start_at: string;
  max_players: number;
  entry_fee: number;
  arcade_name: string;
  reg_count: number;
};

const GAME_COLOR: Record<string, string> = {
  FC26:    'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Tekken8: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  SF6:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  MK1:     'text-pink-400 bg-pink-400/10 border-pink-400/20',
  KOFXV:   'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
  Naruto:  'text-green-400 bg-green-400/10 border-green-400/20',
};

const STATUS_STYLE: Record<string, string> = {
  open:      'text-green-400 bg-green-400/10 border-green-400/20',
  full:      'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  live:      'text-red-400 bg-red-400/10 border-red-400/20',
  completed: 'text-zinc-400 bg-zinc-800 border-zinc-700',
  cancelled: 'text-zinc-600 bg-zinc-800 border-zinc-800',
};

type StatusFilter = 'all' | 'open' | 'full' | 'live' | 'completed' | 'cancelled';

export default function PlatformTournamentsPage() {
  const auth = usePlatformAdmin();
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (auth !== 'ok') return;
    load();
  }, [auth]);

  async function load() {
    const [{ data: tourneyData }, { data: regData }] = await Promise.all([
      supabase
        .from('tournaments')
        .select('id, slug, name, game_type, status, start_at, max_players, entry_fee, arcades(name)')
        .order('start_at', { ascending: false }),
      supabase
        .from('registrations')
        .select('tournament_id')
        .neq('registration_status', 'cancelled'),
    ]);

    const regCountMap: Record<string, number> = {};
    for (const r of (regData ?? [])) {
      regCountMap[r.tournament_id] = (regCountMap[r.tournament_id] ?? 0) + 1;
    }

    setTournaments(
      (tourneyData ?? []).map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        game_type: t.game_type,
        status: t.status,
        start_at: t.start_at,
        max_players: t.max_players,
        entry_fee: Number(t.entry_fee),
        arcade_name: ((t as any).arcades as { name: string } | null)?.name ?? '—',
        reg_count: regCountMap[t.id] ?? 0,
      })),
    );
    setLoading(false);
  }

  const filtered = tournaments.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.arcade_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const countFor = (s: string) => tournaments.filter((t) => t.status === s).length;

  const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
    { id: 'all',       label: `All (${tournaments.length})`       },
    { id: 'open',      label: `Open (${countFor('open')})`        },
    { id: 'live',      label: `Live (${countFor('live')})`        },
    { id: 'full',      label: `Full (${countFor('full')})`        },
    { id: 'completed', label: `Done (${countFor('completed')})`   },
    { id: 'cancelled', label: `Cancelled (${countFor('cancelled')})` },
  ];

  if (auth === 'loading' || (auth === 'ok' && loading)) {
    return (
      <PlatformShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        </div>
      </PlatformShell>
    );
  }

  if (auth === 'denied') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
    );
  }

  return (
    <PlatformShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-white">TOURNAMENTS</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {tournaments.length} total across all arcades
            </p>
          </div>
          <input
            type="search"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors w-60"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6 overflow-x-auto w-fit">
          {STATUS_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === id ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Tournament', 'Arcade', 'Game', 'Status', 'Date', 'Players', 'Entry'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tournaments/${t.slug}`}
                        target="_blank"
                        className="text-zinc-200 font-semibold text-sm hover:text-red-400 transition-colors line-clamp-1 max-w-48 block"
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{t.arcade_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${GAME_COLOR[t.game_type] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        {t.game_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLE[t.status] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {formatDate(t.start_at, 'short')}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {t.reg_count}/{t.max_players}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {t.entry_fee === 0 ? 'Free' : formatCurrency(t.entry_fee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-10 text-center flex flex-col items-center gap-2">
                <Gamepad2 className="w-8 h-8 text-zinc-700" />
                <p className="text-zinc-500 text-sm">No tournaments found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
