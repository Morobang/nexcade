'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loader2, Trophy, Search, ExternalLink, Gamepad2 } from 'lucide-react';

type TournamentRow = {
  id: string;
  name: string;
  slug: string;
  game_type: string;
  status: string;
  start_at: string;
  max_players: number;
  entry_fee: number;
  arcade_name: string;
  reg_count: number;
};

type StatusFilter = 'all' | 'open' | 'live' | 'full' | 'completed' | 'cancelled';

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
  completed: 'text-fg-3 bg-elevated border-stroke',
  cancelled: 'text-fg-3 bg-elevated border-stroke',
};

export default function PlatformTournamentsPage() {
  const authState = usePlatformAdmin();
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (authState !== 'ok') return;
    async function load() {
      const { data: tourneyData } = await supabase
        .from('tournaments')
        .select('id, name, slug, game_type, status, start_at, max_players, entry_fee, arcade_id, arcades(name)')
        .order('start_at', { ascending: false });

      const tourneyIds = (tourneyData ?? []).map((t) => t.id);
      const { data: regData } = tourneyIds.length > 0
        ? await supabase
            .from('registrations')
            .select('tournament_id')
            .in('tournament_id', tourneyIds)
            .neq('registration_status', 'cancelled')
        : { data: [] };

      const regCountMap: Record<string, number> = {};
      for (const r of (regData ?? [])) {
        regCountMap[r.tournament_id] = (regCountMap[r.tournament_id] ?? 0) + 1;
      }

      const rows: TournamentRow[] = (tourneyData ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        game_type: t.game_type,
        status: t.status,
        start_at: t.start_at,
        max_players: t.max_players,
        entry_fee: Number(t.entry_fee),
        arcade_name: ((t as any).arcades as { name: string } | null)?.name ?? '—',
        reg_count: regCountMap[t.id] ?? 0,
      }));

      setTournaments(rows);
      setLoading(false);
    }
    load();
  }, [authState]);

  const filtered = tournaments.filter((t) => {
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.arcade_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authState === 'loading' || (authState === 'ok' && loading)) {
    return (
      <PlatformShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-fg-3 animate-spin" />
        </div>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-fg mb-1">TOURNAMENTS</h1>
            <p className="text-fg-3 text-sm">{tournaments.length} across all arcades</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tournaments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-elevated border border-stroke rounded-xl text-fg text-sm placeholder-fg-3 focus:outline-none focus:border-red-500 transition-colors w-64"
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-elevated border border-stroke rounded-xl p-1 mb-6 overflow-x-auto">
          {(['all', 'open', 'live', 'full', 'completed', 'cancelled'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                statusFilter === f ? 'bg-red-600 text-white' : 'text-fg-3 hover:text-fg'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-stroke">
                  {['Tournament', 'Arcade', 'Game', 'Status', 'Date', 'Players', 'Entry', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-fg-3 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-fg font-semibold text-sm truncate max-w-48">{t.name}</p>
                    </td>
                    <td className="px-4 py-3 text-fg-3 text-xs">{t.arcade_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${GAME_COLOR[t.game_type] ?? 'text-fg-3 bg-elevated border-stroke'}`}>
                        {t.game_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLE[t.status] ?? 'text-fg-3 bg-elevated border-stroke'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg-3 text-xs whitespace-nowrap">{formatDate(t.start_at, 'short')}</td>
                    <td className="px-4 py-3 text-fg-3 text-xs">{t.reg_count}/{t.max_players}</td>
                    <td className="px-4 py-3 text-fg-3 text-xs">
                      {t.entry_fee === 0 ? 'Free' : formatCurrency(t.entry_fee)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tournaments/${t.slug ?? t.id}`}
                        target="_blank"
                        className="text-fg-3 hover:text-fg-2 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-10 text-center">
                <Gamepad2 className="w-8 h-8 text-fg-3 mx-auto mb-3" />
                <p className="text-fg-3 text-sm">
                  {search || statusFilter !== 'all' ? 'No tournaments match your filters.' : 'No tournaments yet.'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </PlatformShell>
  );
}
