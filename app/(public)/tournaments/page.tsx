import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { TournamentFilters } from '@/components/TournamentFilters';
import { MapPin, Calendar, Users, Clock, Tv, Gamepad2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tournaments',
  description: 'Browse all NexCade tournaments across SA arcades. Filter by game, city, and arcade.',
};

const GAME_COLORS: Record<string, string> = {
  FC26: 'text-orange-400',
  Tekken8: 'text-blue-400',
  SF6: 'text-yellow-400',
  MK1: 'text-pink-400',
  KOFXV: 'text-yellow-300',
  Naruto: 'text-green-400',
};

const STATUS_BADGE: Record<string, 'open' | 'full' | 'live' | 'done'> = {
  open: 'open',
  full: 'full',
  live: 'live',
  completed: 'done',
  cancelled: 'done',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TournamentsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  const game = typeof filters.game === 'string' ? filters.game : undefined;
  const status = typeof filters.status === 'string' ? filters.status : undefined;
  const arcade = typeof filters.arcade === 'string' ? filters.arcade : undefined;
  const city = typeof filters.city === 'string' ? filters.city : undefined;

  // Build tournament query with filters
  let query = serverSupabase
    .from('tournaments')
    .select('id, name, slug, game_type, format, status, start_at, entry_fee, prize_pool, max_players, is_streamed, arcade_id, arcades(id, name, city, slug)')
    .neq('status', 'cancelled')
    .order('start_at', { ascending: true });

  if (game) query = query.eq('game_type', game);
  if (status) query = query.eq('status', status);
  if (arcade) query = query.eq('arcade_id', arcade);

  const [{ data: tournaments }, { data: allArcades }] = await Promise.all([
    query,
    serverSupabase.from('arcades').select('id, name, city').eq('is_active', true),
  ]);

  // Filter by city in JS (city is on the arcade, not tournament)
  const filtered = city
    ? tournaments?.filter((t) => (t as any).arcades?.city?.toLowerCase() === city.toLowerCase())
    : tournaments;

  // Fetch registration counts for these tournaments
  const tournamentIds = filtered?.map((t) => t.id) ?? [];
  const { data: regData } = tournamentIds.length
    ? await serverSupabase
        .from('registrations')
        .select('tournament_id')
        .in('tournament_id', tournamentIds)
        .neq('registration_status', 'cancelled')
    : { data: [] };

  const regCounts = (regData ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.tournament_id] = (acc[r.tournament_id] ?? 0) + 1;
    return acc;
  }, {});

  // Build filter options
  const cities = Array.from(new Set(allArcades?.map((a) => a.city) ?? []));
  const gameOptions = [
    { value: '', label: 'All Games' },
    ...['FC26', 'Tekken8', 'SF6', 'MK1', 'KOFXV', 'Naruto'].map((g) => ({ value: g, label: g })),
  ];
  const cityOptions = [
    { value: '', label: 'All Cities' },
    ...cities.map((c) => ({ value: c, label: c })),
  ];
  const arcadeOptions = [
    { value: '', label: 'All Arcades' },
    ...(allArcades ?? []).map((a) => ({ value: a.id, label: a.name })),
  ];

  const list = filtered ?? [];
  const liveCount = list.filter((t) => t.status === 'live').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-5xl text-white mb-2">TOURNAMENTS</h1>
        <div className="flex items-center gap-3 text-zinc-400 text-sm">
          <span>{list.length} tournament{list.length !== 1 ? 's' : ''}</span>
          {liveCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                {liveCount} live now
              </span>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <Suspense>
          <TournamentFilters
            games={gameOptions}
            arcades={arcadeOptions}
            cities={cityOptions}
          />
        </Suspense>
      </div>

      {/* Tournament grid */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <Gamepad2 className="w-16 h-16 text-zinc-700" />
          <p className="text-zinc-400 text-lg font-semibold">No tournaments found</p>
          <p className="text-zinc-600 text-sm">Try changing or clearing the filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((t) => {
            const arcadeInfo = (t as any).arcades as { name: string; city: string; slug: string } | null;
            const registered = regCounts[t.id] ?? 0;
            const spotsPercent = Math.min(100, Math.round((registered / t.max_players) * 100));
            const barColor =
              spotsPercent >= 80 ? 'bg-red-500' : spotsPercent >= 50 ? 'bg-yellow-500' : 'bg-green-500';

            return (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug}`}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col hover:border-zinc-600 hover:shadow-xl hover:shadow-red-600/10 transition-all"
              >
                {/* Game colour bar */}
                <div
                  className="h-1 w-full"
                  style={{ background: gameBarColor(t.game_type) }}
                />

                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className={`text-xs font-bold uppercase tracking-wider ${GAME_COLORS[t.game_type] ?? 'text-zinc-400'}`}>
                        {t.game_type}
                      </span>
                      <h2 className="text-white font-bold text-base mt-0.5 group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                        {t.name}
                      </h2>
                    </div>
                    <div className="shrink-0">
                      <Badge variant={STATUS_BADGE[t.status] ?? 'open'}>
                        {t.status === 'live' ? 'LIVE' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col gap-1.5 text-sm text-zinc-400">
                    {arcadeInfo && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                        {arcadeInfo.name} · {arcadeInfo.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                      {formatDate(t.start_at, 'time')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                      {registered} / {t.max_players} registered
                    </span>
                  </div>

                  {/* Spots progress bar */}
                  <div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${spotsPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">
                      {t.max_players - registered > 0
                        ? `${t.max_players - registered} spot${t.max_players - registered !== 1 ? 's' : ''} left`
                        : 'Full'}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800 mt-auto">
                    <div>
                      <p className="text-xs text-zinc-500">Entry</p>
                      <p className="text-white font-bold text-sm">{formatCurrency(t.entry_fee)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Prize pool</p>
                      <p className="text-yellow-400 font-bold text-sm">{formatCurrency(t.prize_pool)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    {t.is_streamed ? (
                      <span className="flex items-center gap-1 text-purple-400">
                        <Tv className="w-3 h-3" /> Streamed
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <CountdownTimer targetDate={t.start_at} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function gameBarColor(game: string): string {
  const map: Record<string, string> = {
    FC26: '#f97316',
    Tekken8: '#3b82f6',
    SF6: '#eab308',
    MK1: '#ec4899',
    KOFXV: '#fde047',
    Naruto: '#22c55e',
  };
  return map[game] ?? '#71717a';
}
