import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { serverSupabase } from '@/lib/supabase-server';
import { ResultsFilters } from '@/components/ResultsFilters';
import { formatDate } from '@/lib/utils';
import { Trophy, Crown, MapPin, Calendar, Gamepad2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Results',
  description: 'Past tournament winners across all NexCade arcades in South Africa.',
};

const GAME_COLORS: Record<string, string> = {
  FC26: 'bg-orange-500',
  Tekken8: 'bg-blue-500',
  SF6: 'bg-yellow-500',
  MK1: 'bg-pink-500',
  KOFXV: 'bg-yellow-400',
  Naruto: 'bg-green-500',
};

const GAME_TEXT: Record<string, string> = {
  FC26: 'text-orange-400',
  Tekken8: 'text-blue-400',
  SF6: 'text-yellow-400',
  MK1: 'text-pink-400',
  KOFXV: 'text-yellow-300',
  Naruto: 'text-green-400',
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; arcade?: string; from?: string; to?: string }>;
}) {
  const { game, arcade, from, to } = await searchParams;

  const [{ data: tournaments }, { data: winnerResults }, { data: arcadeList }] = await Promise.all([
    serverSupabase
      .from('tournaments')
      .select('id, name, slug, game_type, start_at, arcade_id, arcades(name, city, slug)')
      .eq('status', 'completed')
      .order('start_at', { ascending: false }),
    serverSupabase
      .from('results')
      .select('tournament_id, profile_id, points_awarded, result_data, profiles(gamer_tag, full_name)')
      .eq('is_winner', true),
    serverSupabase
      .from('arcades')
      .select('id, name, city')
      .eq('is_active', true)
      .order('name'),
  ]);

  // Build a map of tournament_id → winners
  type WinnerInfo = {
    gamer_tag: string;
    full_name: string;
    points_awarded: number;
    result_data: Record<string, unknown> | null;
  };

  const winnersByTournament: Record<string, WinnerInfo[]> = {};
  for (const r of winnerResults ?? []) {
    const profile = r.profiles as unknown as { gamer_tag: string; full_name: string } | null;
    if (!profile) continue;
    if (!winnersByTournament[r.tournament_id]) winnersByTournament[r.tournament_id] = [];
    winnersByTournament[r.tournament_id].push({
      gamer_tag: profile.gamer_tag,
      full_name: profile.full_name,
      points_awarded: r.points_awarded,
      result_data: r.result_data as Record<string, unknown> | null,
    });
  }

  // Filter tournaments
  const filtered = (tournaments ?? []).filter((t) => {
    const arcadeInfo = t.arcades as unknown as { name: string; city: string; slug: string } | null;
    if (game && t.game_type !== game) return false;
    if (arcade && t.arcade_id !== arcade) return false;
    if (from && new Date(t.start_at) < new Date(from)) return false;
    if (to && new Date(t.start_at) > new Date(to + 'T23:59:59')) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-display text-5xl text-white mb-2">RESULTS</h1>
        <p className="text-zinc-400">All past tournament winners across South Africa</p>
      </div>

      <Suspense>
        <ResultsFilters
          arcades={arcadeList ?? []}
          activeGame={game}
          activeArcade={arcade}
          activeFrom={from}
          activeTo={to}
        />
      </Suspense>

      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <Trophy className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-semibold">No results found</p>
          <p className="text-zinc-600 text-sm mt-1">
            {game || arcade || from || to
              ? 'Try adjusting the filters.'
              : 'Results will appear once tournaments are completed.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => {
            const arcadeInfo = t.arcades as unknown as { name: string; city: string; slug: string } | null;
            const winners = winnersByTournament[t.id] ?? [];
            const colorBar = GAME_COLORS[t.game_type] ?? 'bg-zinc-600';
            const textColor = GAME_TEXT[t.game_type] ?? 'text-zinc-400';

            return (
              <div
                key={t.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col"
              >
                {/* game colour bar */}
                <div className={`h-1 w-full ${colorBar}`} />

                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* header */}
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>
                      {t.game_type}
                    </span>
                    <Link
                      href={`/tournaments/${t.slug}`}
                      className="block text-white font-bold text-base mt-0.5 hover:text-red-400 transition-colors line-clamp-2"
                    >
                      {t.name}
                    </Link>
                  </div>

                  {/* meta */}
                  <div className="flex flex-col gap-1.5 text-xs text-zinc-500">
                    {arcadeInfo && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <Link
                          href={`/arcades/${arcadeInfo.slug}`}
                          className="hover:text-zinc-300 transition-colors"
                        >
                          {arcadeInfo.name} · {arcadeInfo.city}
                        </Link>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {formatDate(t.start_at, 'short')}
                    </span>
                  </div>

                  {/* winners */}
                  <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-3">
                    {winners.length === 0 ? (
                      <p className="text-zinc-600 text-xs">No winner recorded</p>
                    ) : (
                      winners.map((w, i) => {
                        const character = w.result_data?.character as string | undefined;
                        const team = w.result_data?.team as string | undefined;

                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 border border-yellow-500/40 flex items-center justify-center shrink-0">
                              <Crown className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-bold text-sm truncate">{w.gamer_tag}</p>
                              <p className="text-zinc-500 text-xs truncate">
                                {character
                                  ? character
                                  : team
                                  ? team
                                  : w.full_name}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-yellow-400 font-bold text-sm">{w.points_awarded}</p>
                              <p className="text-zinc-600 text-xs">pts</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
