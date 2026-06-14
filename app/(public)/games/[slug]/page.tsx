import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Trophy, Users, Calendar, ChevronRight, Gamepad2 } from 'lucide-react';

const GAME_META: Record<string, { label: string; description: string; color: string }> = {
  FC26:    { label: 'EA FC 26',       description: 'FIFA-style football game. Compete in 1v1 seasons and cup tournaments.',     color: 'text-orange-400' },
  Tekken8: { label: 'Tekken 8',       description: 'King of Iron Fist returns. 3D fighting at its finest.',                     color: 'text-blue-400'   },
  SF6:     { label: 'Street Fighter 6', description: 'Modern classic 2D fighter with Drive System mechanics.',                  color: 'text-yellow-400' },
  MK1:     { label: 'Mortal Kombat 1', description: 'Brutal 2D fighter. New timeline, classic brutality.',                     color: 'text-pink-400'   },
  KOFXV:   { label: 'KOF XV',         description: 'King of Fighters XV. 3v3 team battle royale.',                             color: 'text-yellow-300' },
  Naruto:  { label: 'Naruto SUNS4',   description: 'Naruto Shippuden: Ultimate Ninja Storm 4. Arena anime fighter.',           color: 'text-green-400'  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = GAME_META[slug];
  if (!meta) return { title: 'Game Not Found' };
  return { title: `${meta.label} Tournaments` };
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const meta = GAME_META[slug];
  if (!meta) notFound();

  const tourneysRes = await serverSupabase
    .from('tournaments')
    .select('id, name, slug, status, start_at, entry_fee, max_players, arcades(name, city)')
    .eq('game_type', slug)
    .in('status', ['open', 'live', 'full'])
    .order('start_at', { ascending: true })
    .limit(20);

  // Top players: get tournament IDs for this game, then aggregate results
  const allTourneysRes = await serverSupabase
    .from('tournaments')
    .select('id')
    .eq('game_type', slug);

  const gameIds = (allTourneysRes.data ?? []).map((t) => t.id);
  const leaderRes = gameIds.length > 0
    ? await serverSupabase
        .from('results')
        .select('points_awarded, profile_id, profiles(gamer_tag, avatar_url)')
        .in('tournament_id', gameIds)
        .order('points_awarded', { ascending: false })
        .limit(20)
    : { data: [] };

  const tournaments = tourneysRes.data ?? [];

  // Aggregate points per player
  const leaderMap = new Map<string, { gamer_tag: string; total: number }>();
  for (const r of (leaderRes.data ?? [])) {
    const p = (r as any).profiles as { gamer_tag: string } | null;
    if (!p) continue;
    const existing = leaderMap.get(r.profile_id) ?? { gamer_tag: p.gamer_tag, total: 0 };
    existing.total += Number(r.points_awarded ?? 0);
    leaderMap.set(r.profile_id, existing);
  }
  const leaders = Array.from(leaderMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const STATUS_STYLE: Record<string, string> = {
    open: 'text-green-400 bg-green-400/10 border-green-400/20',
    full: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    live: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="mb-10">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold mb-4 ${meta.color}`}>
          <Gamepad2 className="w-3.5 h-3.5" />
          Game
        </div>
        <h1 className={`font-display text-6xl sm:text-7xl mb-3 ${meta.color}`}>{meta.label.toUpperCase()}</h1>
        <p className="text-fg-2 text-lg max-w-xl">{meta.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Active tournaments */}
        <div className="md:col-span-2">
          <h2 className="text-fg font-bold text-base mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-red-500" />
            Active Tournaments
          </h2>
          {tournaments.length === 0 && (
            <div className="bg-surface border border-stroke rounded-2xl p-10 text-center">
              <Gamepad2 className="w-8 h-8 text-fg-3 mx-auto mb-3" />
              <p className="text-fg-3 text-sm">No active {meta.label} tournaments right now.</p>
              <Link href="/tournaments" className="text-red-400 hover:text-red-300 text-sm font-semibold mt-2 inline-block transition-colors">
                Browse all tournaments
              </Link>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {tournaments.map((t) => {
              const arcade = (t as any).arcades as { name: string; city: string } | null;
              return (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.slug ?? t.id}`}
                  className="bg-surface border border-stroke rounded-xl p-4 flex items-center gap-4 hover:border-zinc-500 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${STATUS_STYLE[t.status] ?? ''}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-fg font-semibold text-sm truncate group-hover:text-red-400 transition-colors">{t.name}</p>
                    <p className="text-fg-3 text-xs mt-0.5">
                      {arcade ? `${arcade.name} · ${arcade.city}` : '—'}
                      {t.start_at ? ` · ${formatDate(t.start_at, 'short')}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-fg-2 text-xs font-semibold">{t.entry_fee === 0 ? 'Free' : formatCurrency(Number(t.entry_fee))}</p>
                    <p className="text-fg-3 text-xs mt-0.5 flex items-center gap-1 justify-end">
                      <Users className="w-3 h-3" />{t.max_players} slots
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-fg-3 group-hover:text-fg-2 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-stroke rounded-xl p-4">
            <h3 className="text-fg font-bold text-sm mb-3">Quick Links</h3>
            <div className="flex flex-col gap-1.5">
              <Link href="/tournaments" className="text-fg-2 hover:text-red-400 text-sm transition-colors flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-fg-3" />All tournaments
              </Link>
              <Link href="/leaderboard" className="text-fg-2 hover:text-red-400 text-sm transition-colors flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-fg-3" />Leaderboard
              </Link>
              <Link href="/arcades" className="text-fg-2 hover:text-red-400 text-sm transition-colors flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-fg-3" />Find arcades
              </Link>
            </div>
          </div>

          {leaders.length > 0 && (
            <div className="bg-surface border border-stroke rounded-xl p-4">
              <h3 className="text-fg font-bold text-sm mb-3">Top Players</h3>
              <div className="flex flex-col gap-2">
                {leaders.map((p, i) => (
                  <div key={p.gamer_tag} className="flex items-center gap-2 text-sm">
                    <span className="text-fg-3 text-xs w-5 shrink-0">#{i + 1}</span>
                    <span className="text-fg-2 truncate">{p.gamer_tag}</span>
                    <span className="ml-auto text-fg-3 text-xs shrink-0">{p.total} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
