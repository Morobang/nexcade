import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { LeaderboardFilters } from '@/components/LeaderboardFilters';
import { Medal, Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'National rankings across all NexCade arcades in South Africa.',
};

const GAME_COLORS: Record<string, string> = {
  FC26: 'text-orange-400',
  Tekken8: 'text-blue-400',
  SF6: 'text-yellow-400',
  MK1: 'text-pink-400',
  KOFXV: 'text-yellow-300',
  Naruto: 'text-green-400',
};

type PlayerRow = {
  id: string;
  gamer_tag: string;
  full_name: string;
  avatar_url: string | null;
  points: number;
  wins: number;
  played: number;
  winRate: number;
  mainGame: string;
};

const PODIUM = {
  1: { medal: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' },
  2: { medal: 'text-zinc-400',   border: 'border-zinc-600/40',   bg: 'bg-zinc-800/60'   },
  3: { medal: 'text-orange-600', border: 'border-orange-800/40', bg: 'bg-orange-900/10'  },
} as const;

function PodiumCard({ player, rank }: { player: PlayerRow; rank: 1 | 2 | 3 }) {
  const s = PODIUM[rank];
  return (
    <Link
      href={`/profile/${player.id}`}
      className={`flex-1 max-w-[220px] ${s.bg} border ${s.border} rounded-xl p-5 flex flex-col items-center gap-2 text-center hover:brightness-110 transition-all ${rank === 1 ? 'sm:scale-105' : 'sm:mb-4'}`}
    >
      <Medal className={`w-7 h-7 ${s.medal}`} />
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center overflow-hidden border-2 border-zinc-700">
        {player.avatar_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-white font-black text-xl">{player.gamer_tag[0].toUpperCase()}</span>
        }
      </div>
      <div>
        <p className={`font-bold text-base ${s.medal}`}>{player.gamer_tag}</p>
        <p className="text-zinc-500 text-xs">{player.full_name}</p>
      </div>
      <span className={`text-xs font-semibold ${GAME_COLORS[player.mainGame] ?? 'text-zinc-400'}`}>
        {player.mainGame}
      </span>
      <div className="mt-1 pt-3 border-t border-zinc-800/50 w-full text-center">
        <p className={`font-display text-3xl ${s.medal}`}>{player.points}</p>
        <p className="text-zinc-500 text-xs">points</p>
      </div>
    </Link>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; arcade?: string; season?: string; search?: string }>;
}) {
  const { game, arcade, season, search } = await searchParams;

  const [{ data: rawResults }, { data: arcadeList }, { data: seasonRows }] = await Promise.all([
    serverSupabase
      .from('results')
      .select('profile_id, is_winner, points_awarded, profiles(id, gamer_tag, full_name, avatar_url), tournaments(game_type, arcade_id)'),
    serverSupabase
      .from('arcades')
      .select('id, name, city')
      .eq('is_active', true)
      .order('name'),
    serverSupabase
      .from('season_points')
      .select('season, tournament_id'),
  ]);

  // If season filter is active, collect the tournament IDs for that season
  const seasonTournamentIds = season
    ? new Set((seasonRows ?? []).filter((r) => r.season === season).map((r) => r.tournament_id))
    : null;

  // Filter results
  const filtered = (rawResults ?? []).filter((r) => {
    const t = r.tournaments as unknown as { game_type: string; arcade_id: string } | null;
    if (!t) return false;
    if (game && t.game_type !== game) return false;
    if (arcade && t.arcade_id !== arcade) return false;
    return true;
  });

  // Aggregate per player
  const playerMap: Record<string, {
    id: string;
    gamer_tag: string;
    full_name: string;
    avatar_url: string | null;
    points: number;
    wins: number;
    played: number;
    gameCounts: Record<string, number>;
  }> = {};

  for (const result of filtered) {
    const profile = result.profiles as unknown as { id: string; gamer_tag: string; full_name: string; avatar_url: string | null } | null;
    const tournament = result.tournaments as unknown as { game_type: string; arcade_id: string } | null;
    if (!profile || !tournament) continue;

    const pid = result.profile_id;
    if (!playerMap[pid]) {
      playerMap[pid] = {
        id: profile.id,
        gamer_tag: profile.gamer_tag,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        points: 0,
        wins: 0,
        played: 0,
        gameCounts: {},
      };
    }

    playerMap[pid].points += result.points_awarded;
    playerMap[pid].played += 1;
    if (result.is_winner) playerMap[pid].wins += 1;

    const g = tournament.game_type;
    playerMap[pid].gameCounts[g] = (playerMap[pid].gameCounts[g] ?? 0) + 1;
  }

  const q = search?.toLowerCase().trim() ?? '';

  const rows: PlayerRow[] = Object.values(playerMap)
    .map((p) => ({
      id: p.id,
      gamer_tag: p.gamer_tag,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      points: p.points,
      wins: p.wins,
      played: p.played,
      winRate: p.played > 0 ? Math.round((p.wins / p.played) * 100) : 0,
      mainGame: Object.entries(p.gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
    }))
    .filter((p) =>
      !q || p.gamer_tag.toLowerCase().includes(q) || p.full_name.toLowerCase().includes(q)
    )
    .sort((a, b) => b.points - a.points || b.wins - a.wins);

  const top3 = rows.slice(0, 3) as PlayerRow[];
  const rest = rows.slice(3);

  const seasons = [...new Set((seasonRows ?? []).map((r) => r.season))].sort().reverse();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-display text-5xl text-white mb-2">LEADERBOARD</h1>
        <p className="text-zinc-400">National rankings across all NexCade arcades</p>
      </div>

      <Suspense>
        <LeaderboardFilters
          arcades={(arcadeList ?? []).map((a) => ({ id: a.id, name: a.name, city: a.city }))}
          seasons={seasons}
          activeGame={game}
          activeArcade={arcade}
          activeSeason={season}
          activeSearch={search}
        />
      </Suspense>

      {rows.length === 0 ? (
        <div className="text-center py-24">
          <Trophy className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-semibold">No results yet</p>
          <p className="text-zinc-600 text-sm mt-1">
            {game || arcade || season || search
              ? 'Try adjusting your search or filters.'
              : 'Rankings will appear once tournaments are completed.'}
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="overflow-x-auto mb-12">
            <div className="flex items-end justify-center gap-4 sm:gap-6 min-w-[480px] pb-2">
              {top3[1] ? (
                <PodiumCard player={top3[1]} rank={2} />
              ) : (
                <div className="flex-1 max-w-[220px]" />
              )}
              {top3[0] && <PodiumCard player={top3[0]} rank={1} />}
              {top3[2] ? (
                <PodiumCard player={top3[2]} rank={3} />
              ) : (
                <div className="flex-1 max-w-[220px]" />
              )}
            </div>
          </div>

          {/* Full table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[48px_1fr_120px_80px_60px_60px_90px] gap-4 px-5 py-3 border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              <span>#</span>
              <span>Player</span>
              <span>Main</span>
              <span className="text-right">Points</span>
              <span className="text-right">Wins</span>
              <span className="text-right">Played</span>
              <span className="text-right">Win %</span>
            </div>

            {rows.map((player, idx) => {
              const rankColor =
                idx === 0 ? 'text-yellow-400'
                : idx === 1 ? 'text-zinc-400'
                : idx === 2 ? 'text-orange-600'
                : 'text-zinc-600';

              return (
                <Link
                  key={player.id}
                  href={`/profile/${player.id}`}
                  className="grid grid-cols-[48px_1fr] sm:grid-cols-[48px_1fr_120px_80px_60px_60px_90px] gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/40 transition-colors items-center"
                >
                  <span className={`font-display text-2xl leading-none ${rankColor}`}>
                    {idx + 1}
                  </span>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden">
                      {player.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white font-black text-sm">{player.gamer_tag[0].toUpperCase()}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold truncate">{player.gamer_tag}</p>
                      <p className="text-zinc-500 text-xs truncate">{player.full_name}</p>
                    </div>
                  </div>

                  <span className={`hidden sm:block text-sm font-semibold ${GAME_COLORS[player.mainGame] ?? 'text-zinc-400'}`}>
                    {player.mainGame}
                  </span>

                  <span className="hidden sm:block text-right text-white font-bold">
                    {player.points}
                  </span>

                  <span className="hidden sm:block text-right text-zinc-300">
                    {player.wins}
                  </span>

                  <span className="hidden sm:block text-right text-zinc-400">
                    {player.played}
                  </span>

                  <div className="hidden sm:flex flex-col items-end gap-1.5">
                    <span className="text-sm font-semibold text-zinc-300">{player.winRate}%</span>
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          player.winRate >= 70 ? 'bg-green-500'
                          : player.winRate >= 40 ? 'bg-yellow-500'
                          : 'bg-red-500'
                        }`}
                        style={{ width: `${player.winRate}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
