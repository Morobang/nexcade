'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CreateTournamentForm } from './CreateTournamentForm';
import {
  Loader2, AlertCircle, Trophy, Users, ArrowLeft,
  Gamepad2, Calendar, ChevronRight,
} from 'lucide-react';

type Arcade = { id: string; name: string; city: string };

type TournamentRow = {
  id: string;
  name: string;
  slug: string;
  game_type: string;
  format: string;
  status: string;
  start_at: string;
  max_players: number;
  entry_fee: number;
  prize_pool: number;
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

const FORMAT_LABEL: Record<string, string> = {
  knockout: 'Elimination',
  group_ko: 'Group + KO',
  league:   'League',
};

export default function AdminTournamentsPage() {
  const router = useRouter();
  const [arcade, setArcade] = useState<Arcade | null>(null);
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadTournaments = useCallback(async (arcadeId: string) => {
    const { data } = await supabase
      .from('tournaments')
      .select('id, name, slug, game_type, format, status, start_at, max_players, entry_fee, prize_pool')
      .eq('arcade_id', arcadeId)
      .order('start_at', { ascending: false });

    if (!data || data.length === 0) { setTournaments([]); return; }

    const ids = data.map((t) => t.id);
    const { data: regData } = await supabase
      .from('registrations')
      .select('tournament_id')
      .in('tournament_id', ids)
      .neq('registration_status', 'cancelled');

    const countMap: Record<string, number> = {};
    for (const r of (regData ?? [])) {
      countMap[r.tournament_id] = (countMap[r.tournament_id] ?? 0) + 1;
    }

    setTournaments(data.map((t) => ({ ...t, reg_count: countMap[t.id] ?? 0 })));
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['arcade_owner', 'platform_admin'].includes(profile.role)) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const { data: arcadeData } = await supabase
        .from('arcades')
        .select('id, name, city')
        .eq('owner_id', user.id)
        .single();

      if (!arcadeData) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setArcade(arcadeData);
      await loadTournaments(arcadeData.id);
      setLoading(false);
    }
    load();
  }, [router, loadTournaments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-white mb-2">ACCESS DENIED</h1>
          <p className="text-zinc-400 text-sm mb-6">This area is for arcade owners only.</p>
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to admin
        </Link>
        <span className="text-zinc-700">/</span>
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">{arcade!.name}</p>
          <h1 className="font-display text-3xl text-white leading-none">TOURNAMENTS</h1>
        </div>
      </div>

      {/* Create form */}
      <div className="mb-10">
        <CreateTournamentForm
          arcadeId={arcade!.id}
          onCreated={() => loadTournaments(arcade!.id)}
        />
      </div>

      {/* Tournament list */}
      <div>
        <h2 className="font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-red-500" />
          Your Tournaments
          <span className="text-zinc-600 font-normal">({tournaments.length})</span>
        </h2>

        {tournaments.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <Gamepad2 className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No tournaments yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-zinc-800">
              {tournaments.map((t) => (
                <div key={t.id} className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${GAME_COLOR[t.game_type] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        {t.game_type}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLE[t.status] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-zinc-200 text-sm font-semibold truncate">{t.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(t.start_at, 'short')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {t.reg_count}/{t.max_players}
                      </span>
                      <span>{FORMAT_LABEL[t.format] ?? t.format}</span>
                      <span>{formatCurrency(t.entry_fee)} entry</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-zinc-500">Prize pool</p>
                      <p className="text-sm font-bold text-white">{formatCurrency(t.prize_pool)}</p>
                    </div>
                    {t.format === 'group_ko' && (
                      <Link
                        href={`/admin/tournaments/${t.id}/groups`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors"
                      >
                        Groups
                      </Link>
                    )}
                    <Link
                      href={`/tournaments/${t.slug}`}
                      className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                      target="_blank"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
