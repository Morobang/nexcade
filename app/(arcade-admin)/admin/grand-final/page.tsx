'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { getCurrentSeasonName } from '@/lib/points';
import {
  Loader2, AlertCircle, ArrowLeft, Shield, Trophy,
  Crown, Users, ChevronRight, Gamepad2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Arcade = { id: string; name: string };

type Qualifier = {
  tournament_id: string;
  tournament_name: string;
  game_type: string;
  start_at: string;
  status: string;
  top_players: { profile_id: string; gamer_tag: string; full_name: string; placement: number }[];
};

// ── Constants ──────────────────────────────────────────────────────────────────

const GAME_COLOR: Record<string, string> = {
  FC26:    'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Tekken8: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  SF6:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  MK1:     'text-pink-400 bg-pink-400/10 border-pink-400/20',
  KOFXV:   'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
  Naruto:  'text-green-400 bg-green-400/10 border-green-400/20',
};

const PLACEMENT_LABEL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminGrandFinalPage() {
  const router = useRouter();
  const [arcade, setArcade] = useState<Arcade | null>(null);
  const [qualifiers, setQualifiers] = useState<Qualifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const loadData = useCallback(async (arcadeId: string) => {
    // Fetch qualifier tournaments
    const { data: qualTourneys } = await supabase
      .from('tournaments')
      .select('id, name, game_type, start_at, status')
      .eq('arcade_id', arcadeId)
      .eq('is_qualifier', true)
      .order('start_at', { ascending: false });

    if (!qualTourneys || qualTourneys.length === 0) { setQualifiers([]); return; }

    const ids = qualTourneys.map((t) => t.id);

    // Fetch top results for those tournaments
    const { data: resultData } = await supabase
      .from('results')
      .select('tournament_id, profile_id, placement, profiles(gamer_tag, full_name)')
      .in('tournament_id', ids)
      .lte('placement', 4)
      .order('placement', { ascending: true });

    const resultsByTourney: Record<string, Qualifier['top_players']> = {};
    for (const r of (resultData ?? [])) {
      const p = (r as any).profiles as { gamer_tag: string; full_name: string } | null;
      if (!p) continue;
      if (!resultsByTourney[r.tournament_id]) resultsByTourney[r.tournament_id] = [];
      resultsByTourney[r.tournament_id].push({
        profile_id: r.profile_id,
        gamer_tag: p.gamer_tag,
        full_name: p.full_name,
        placement: r.placement,
      });
    }

    setQualifiers(qualTourneys.map((t) => ({
      tournament_id: t.id,
      tournament_name: t.name,
      game_type: t.game_type,
      start_at: t.start_at,
      status: t.status,
      top_players: resultsByTourney[t.id] ?? [],
    })));
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (!profile || !['arcade_owner', 'platform_admin'].includes(profile.role)) {
        setUnauthorized(true); setLoading(false); return;
      }

      const { data: arcadeData } = await supabase
        .from('arcades').select('id, name').eq('owner_id', user.id).single();

      if (!arcadeData) { setUnauthorized(true); setLoading(false); return; }

      setArcade(arcadeData);
      await loadData(arcadeData.id);
      setLoading(false);
    }
    init();
  }, [router, loadData]);

  async function createGrandFinal(gameType: string, qualifiedPlayers: Qualifier['top_players']) {
    if (!arcade) return;
    setActionLoading(`gf-${gameType}`);

    const season = getCurrentSeasonName();
    const slug = `${gameType.toLowerCase()}-grand-final-${season.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: tourney, error } = await supabase
      .from('tournaments')
      .insert({
        arcade_id: arcade.id,
        name: `${gameType} Grand Final — ${season}`,
        slug,
        game_type: gameType,
        format: 'knockout',
        status: 'open',
        max_players: Math.max(nextPow2(qualifiedPlayers.length), 4),
        entry_fee: 0,
        prize_pool: 0,
        start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        is_qualifier: false,
        description: `Grand Final for ${season}. Qualified players: ${qualifiedPlayers.map((p) => p.gamer_tag).join(', ')}.`,
      })
      .select('id, slug')
      .single();

    if (!error && tourney) {
      // Register all qualified players
      for (const player of qualifiedPlayers) {
        await supabase.from('registrations').insert({
          tournament_id: tourney.id,
          profile_id: player.profile_id,
          registration_status: 'registered',
          payment_status: 'paid',
          booking_ref: `GF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          rules_agreed: true,
        });
      }
      setCreated(`/tournaments/${tourney.slug}`);
    }

    setActionLoading(null);
  }

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
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">Back to home</Link>
        </div>
      </div>
    );
  }

  // Group qualifiers by game
  const byGame: Record<string, Qualifier[]> = {};
  for (const q of qualifiers) {
    if (!byGame[q.game_type]) byGame[q.game_type] = [];
    byGame[q.game_type].push(q);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to admin
        </Link>
        <span className="text-zinc-700">/</span>
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">{arcade!.name} · {getCurrentSeasonName()}</p>
          <h1 className="font-display text-3xl text-white leading-none">GRAND FINAL</h1>
        </div>
      </div>

      {/* Created success */}
      {created && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
            <Trophy className="w-4 h-4" />
            Grand Final tournament created!
          </div>
          <Link href={created} target="_blank"
            className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm transition-colors">
            View tournament <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {qualifiers.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-semibold mb-1">No qualifier tournaments yet</p>
          <p className="text-zinc-600 text-sm mb-5">Create tournaments with the Qualifier toggle enabled, then complete them to see qualified players here.</p>
          <Link href="/admin/tournaments"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-bold transition-colors">
            <Gamepad2 className="w-4 h-4" />
            Create Qualifier Tournament
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(byGame).map(([game, quals]) => {
            // Collect all unique qualified players for this game (top 2 from each qualifier)
            const qualifiedMap = new Map<string, Qualifier['top_players'][number]>();
            for (const q of quals) {
              for (const p of q.top_players.filter((p) => p.placement <= 2)) {
                if (!qualifiedMap.has(p.profile_id)) qualifiedMap.set(p.profile_id, p);
              }
            }
            const qualified = [...qualifiedMap.values()].sort((a, b) => a.placement - b.placement);

            return (
              <div key={game} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Game header */}
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${GAME_COLOR[game] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                      {game}
                    </span>
                    <div>
                      <p className="text-white font-bold text-sm">{game} Qualifiers</p>
                      <p className="text-zinc-500 text-xs">{quals.length} qualifier event{quals.length !== 1 ? 's' : ''} · {qualified.length} player{qualified.length !== 1 ? 's' : ''} qualified</p>
                    </div>
                  </div>

                  {qualified.length >= 2 && (
                    <button
                      onClick={() => createGrandFinal(game, qualified)}
                      disabled={!!actionLoading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shrink-0"
                    >
                      {actionLoading === `gf-${game}`
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Crown className="w-4 h-4" />}
                      Create Grand Final
                    </button>
                  )}
                </div>

                {/* Qualifier events */}
                {quals.map((q) => (
                  <div key={q.tournament_id} className="px-5 py-4 border-b border-zinc-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-zinc-300 text-sm font-semibold">{q.tournament_name}</p>
                        <p className="text-zinc-600 text-xs">{formatDate(q.start_at, 'short')} · {q.status}</p>
                      </div>
                      {q.top_players.length === 0 && (
                        <span className="text-zinc-600 text-xs italic">No results yet</span>
                      )}
                    </div>

                    {q.top_players.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {q.top_players.map((p) => (
                          <div key={p.profile_id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                              p.placement <= 2
                                ? 'text-green-400 bg-green-500/10 border-green-500/20'
                                : 'text-zinc-500 bg-zinc-800 border-zinc-700'
                            }`}>
                            <span className="font-bold">{PLACEMENT_LABEL[p.placement] ?? `${p.placement}th`}</span>
                            <span className="font-semibold">{p.gamer_tag}</span>
                            {p.placement <= 2 && (
                              <span className="text-green-600 text-xs font-bold">✓ Qualified</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Qualified players summary */}
                {qualified.length > 0 && (
                  <div className="px-5 py-4 bg-zinc-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Grand Final Roster</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {qualified.map((p) => (
                        <span key={p.profile_id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                          <Crown className="w-3 h-3" />
                          {p.gamer_tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}
