import Link from 'next/link';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer, HeroCountdown } from '@/components/CountdownTimer';
import { HomepageArcadeMap } from '@/components/HomepageArcadeMap';
import {
  MapPin,
  Trophy,
  Users,
  Calendar,
  ChevronRight,
  Gamepad2,
  Zap,
  Medal,
  Clock,
  Tv,
} from 'lucide-react';

const btn = {
  fire: 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 px-7 py-3.5 text-lg bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-lg hover:shadow-red-500/50',
  ghost: 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 px-7 py-3.5 text-lg bg-transparent text-zinc-200 hover:bg-zinc-800 border border-zinc-700',
  gold: 'inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all duration-200 px-7 py-3.5 text-lg bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg hover:shadow-yellow-500/50',
  ghostRed: 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 px-7 py-3.5 text-lg bg-transparent text-white border border-red-400 hover:bg-red-700',
} as const;

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

export default async function Home() {
  const [
    { data: tournaments },
    { data: arcades },
    { data: recentRegs },
    { data: topResults },
  ] = await Promise.all([
    serverSupabase
      .from('tournaments')
      .select('id, name, slug, game_type, status, start_at, entry_fee, prize_pool, max_players, is_streamed, arcades(name, city, slug)')
      .in('status', ['open', 'live'])
      .order('start_at', { ascending: true })
      .limit(6),
    serverSupabase
      .from('arcades')
      .select('id, name, slug, city, games_supported, description, latitude, longitude, tournaments(count)')
      .eq('is_active', true)
      .order('name'),
    serverSupabase
      .from('registrations')
      .select('id, registered_at, profiles(gamer_tag), tournaments(name, game_type)')
      .order('registered_at', { ascending: false })
      .limit(10),
    serverSupabase
      .from('season_points')
      .select('profile_id, points, profiles(full_name, gamer_tag, avatar_url)')
      .order('points', { ascending: false })
      .limit(100),
  ]);

  const liveTournament = tournaments?.find((t) => t.status === 'live');
  const nextTournament = tournaments?.find((t) => t.status === 'open');
  const upcomingTournaments = tournaments ?? [];

  // Sort arcades by tournament count so featured section shows most active venues
  const sortedArcades = (arcades ?? []).slice().sort((a, b) => {
    const aCount = (a as any).tournaments?.[0]?.count ?? 0;
    const bCount = (b as any).tournaments?.[0]?.count ?? 0;
    return bCount - aCount;
  });

  // Aggregate season points per player and take top 5
  type TopPlayer = { profile_id: string; full_name: string; gamer_tag: string; avatar_url: string | null; total_points: number };
  const playerMap = new Map<string, TopPlayer>();
  for (const row of (topResults ?? [])) {
    const profile = (row as any).profiles as { full_name: string; gamer_tag: string; avatar_url: string | null } | null;
    if (!profile) continue;
    const existing = playerMap.get(row.profile_id);
    if (existing) {
      existing.total_points += row.points;
    } else {
      playerMap.set(row.profile_id, {
        profile_id: row.profile_id,
        full_name: profile.full_name,
        gamer_tag: profile.gamer_tag,
        avatar_url: profile.avatar_url,
        total_points: row.points,
      });
    }
  }
  const topPlayers = Array.from(playerMap.values())
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 5);

  return (
    <>
      {/* Live banner */}
      {liveTournament && (
        <div className="bg-red-600 text-white text-sm font-semibold text-center py-2.5 px-4 flex items-center justify-center gap-3">
          <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
          LIVE NOW:{' '}
          <span className="font-bold">{(liveTournament as any).arcades?.name}</span> is
          streaming&nbsp;
          <strong>{liveTournament.name}</strong>
          <Link
            href={`/tournaments/${liveTournament.slug}`}
            className="underline underline-offset-2 hover:no-underline ml-1"
          >
            Watch live
          </Link>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        {/* background grid */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col md:flex-row items-center gap-16">
          {/* copy */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-red-500 text-sm font-bold uppercase tracking-widest mb-4">
              South Africa&apos;s gaming arena
            </p>
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl text-white leading-none mb-6">
              COMPETE.<br />RANK UP.<br />
              <span className="text-red-500">REPRESENT SA.</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md mb-8 mx-auto md:mx-0">
              One profile. Every arcade. Join the national tournament network and prove you&apos;re the best in SA.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link href="/tournaments" className={btn.fire}>View Tournaments</Link>
              <Link href="/signup" className={btn.ghost}>Create Account</Link>
            </div>
          </div>

          {/* countdown */}
          {nextTournament && (
            <div className="shrink-0 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 text-center backdrop-blur-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Next tournament</p>
              <p className="text-white font-bold text-lg mb-1">{nextTournament.name}</p>
              <p className={`text-sm mb-6 ${GAME_COLORS[nextTournament.game_type] ?? 'text-zinc-400'}`}>
                {nextTournament.game_type}
              </p>
              <HeroCountdown
                targetDate={nextTournament.start_at}
                label="Starts in"
              />
              <Link
                href={`/tournaments/${nextTournament.slug}`}
                className="mt-6 inline-block text-sm text-red-400 hover:text-red-300 font-semibold"
              >
                Register now →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── WHAT IS NEXCADE ── */}
      <section className="border-b border-zinc-800 bg-zinc-900/40 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-3">
              ONE PLATFORM. EVERY ARCADE IN SA.
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              NexCade connects South Africa&apos;s gaming arcades into a single national tournament network.
              Create one profile, compete at any venue, and build your national ranking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: 'Your NexCade ID',
                body: 'One account that works at every registered arcade in SA. Your stats, wins, and rank follow you everywhere.',
                color: 'text-red-500',
              },
              {
                icon: Trophy,
                title: 'National Tournaments',
                body: 'Arcades host weekly tournaments across FC26, Tekken 8, Street Fighter 6, MK1, KOFXV, and Naruto.',
                color: 'text-yellow-400',
              },
              {
                icon: Medal,
                title: 'Season Rankings',
                body: 'Earn points every tournament. Top players from each season qualify for the NexCade Grand Final.',
                color: 'text-orange-400',
              },
              {
                icon: Tv,
                title: 'Live Streams',
                body: 'Watch finals live on YouTube or Twitch, embedded right here. Never miss a match.',
                color: 'text-purple-400',
              },
            ].map(({ icon: Icon, title, body, color }) => (
              <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3">
                <Icon className={`w-7 h-7 ${color}`} />
                <h3 className="text-white font-bold text-base">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '6', label: 'Games supported' },
              { value: 'R500+', label: 'Prize pools per event' },
              { value: '100', label: 'Points for a first place' },
              { value: 'Free', label: 'To create an account' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-4xl text-red-500">{value}</p>
                <p className="text-zinc-500 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPCOMING TOURNAMENTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-display text-4xl text-white">UPCOMING TOURNAMENTS</h2>
            <p className="text-zinc-500 mt-1">Register before spots fill up</p>
          </div>
          <Link
            href="/tournaments"
            className="hidden sm:flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingTournaments.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No upcoming tournaments. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTournaments.map((t) => {
              const arcade = (t as any).arcades as { name: string; city: string; slug: string } | null;
              return (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.slug}`}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 hover:border-zinc-600 hover:shadow-xl hover:shadow-red-600/10 transition-all"
                >
                  {/* header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${GAME_COLORS[t.game_type] ?? 'text-zinc-400'}`}>
                        {t.game_type}
                      </span>
                      <h3 className="text-white font-bold text-base mt-0.5 group-hover:text-red-400 transition-colors line-clamp-2">
                        {t.name}
                      </h3>
                    </div>
                    <Badge variant={STATUS_BADGE[t.status] ?? 'open'}>
                      {t.status === 'live' ? 'LIVE' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </Badge>
                  </div>

                  {/* meta */}
                  <div className="flex flex-col gap-1.5 text-sm text-zinc-400">
                    {arcade && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {arcade.name} · {arcade.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {formatDate(t.start_at, 'time')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      {t.max_players} spots
                    </span>
                  </div>

                  {/* footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800 mt-auto">
                    <div>
                      <p className="text-xs text-zinc-500">Entry</p>
                      <p className="text-white font-bold">{formatCurrency(t.entry_fee)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Prize pool</p>
                      <p className="text-yellow-400 font-bold">{formatCurrency(t.prize_pool)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {t.is_streamed && (
                      <span className="flex items-center gap-1 text-xs text-purple-400">
                        <Tv className="w-3 h-3" /> Streamed
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <CountdownTimer targetDate={t.start_at} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex sm:hidden justify-center mt-8">
          <Link href="/tournaments" className={btn.ghost}>View all tournaments</Link>
        </div>
      </section>

      {/* ── HYPE WALL ── */}
      {recentRegs && recentRegs.length > 0 && (
        <section className="border-y border-zinc-800 bg-zinc-900/50 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Live Activity</h3>
            </div>
            <div className="flex flex-col gap-2">
              {recentRegs.slice(0, 6).map((reg) => {
                const profile = (reg as any).profiles as { gamer_tag: string } | null;
                const tournament = (reg as any).tournaments as { name: string; game_type: string } | null;
                if (!profile || !tournament) return null;
                return (
                  <div key={reg.id} className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="text-white font-semibold">{profile.gamer_tag}</span>
                    <span>registered for</span>
                    <span className={`font-medium ${GAME_COLORS[tournament.game_type] ?? ''}`}>
                      {tournament.game_type}
                    </span>
                    <span className="hidden sm:inline">— {tournament.name}</span>
                    <span className="ml-auto text-xs text-zinc-600 shrink-0">
                      {formatDate(reg.registered_at, 'short')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED ARCADES ── */}
      {arcades && arcades.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-4xl text-white">FEATURED ARCADES</h2>
              <p className="text-zinc-500 mt-1">The venues running NexCade events</p>
            </div>
            <Link
              href="/arcades"
              className="hidden sm:flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Explore all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {sortedArcades.slice(0, 4).map((arcade) => (
              <Link
                key={arcade.id}
                href={`/arcades/${arcade.slug}`}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 hover:border-zinc-600 hover:shadow-xl hover:shadow-red-600/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-lg">{arcade.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg group-hover:text-red-400 transition-colors truncate">
                      {arcade.name}
                    </h3>
                    <p className="text-zinc-500 text-sm flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {arcade.city}
                    </p>
                  </div>
                </div>

                {arcade.description && (
                  <p className="text-zinc-400 text-sm line-clamp-2">{arcade.description}</p>
                )}

                {arcade.games_supported && arcade.games_supported.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(arcade.games_supported as string[]).map((game) => (
                      <span
                        key={game}
                        className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-300"
                      >
                        {game}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="border-y border-zinc-800 bg-zinc-900/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl text-white text-center mb-12">HOW IT WORKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                step: '01',
                title: 'Create your NexCade ID',
                body: 'Sign up once. Your profile, stats, and rank follow you across every registered arcade in SA.',
              },
              {
                icon: Gamepad2,
                step: '02',
                title: 'Find a tournament',
                body: 'Browse tournaments by game, city, or arcade. Register in seconds — entry fees go straight to the prize pool.',
              },
              {
                icon: Trophy,
                step: '03',
                title: 'Compete and rank up',
                body: 'Earn season points with every win. Top players qualify for the NexCade Grand Final.',
              },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <span className="font-display text-8xl text-zinc-800 leading-none select-none">
                    {step}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <h3 className="text-white font-bold text-xl">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEADERBOARD SNAPSHOT ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-display text-4xl text-white">TOP PLAYERS</h2>
            <p className="text-zinc-500 mt-1">Current season leaders</p>
          </div>
          <Link
            href="/leaderboard"
            className="hidden sm:flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Full leaderboard <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {topPlayers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {topPlayers.map((player, idx) => {
              const medalColors = ['text-yellow-400', 'text-zinc-300', 'text-orange-600'];
              const isTop3 = idx < 3;
              const highlightFirst = idx === 0;

              return (
                <Link
                  key={player.profile_id}
                  href={`/profile/${player.profile_id}`}
                  className={`bg-zinc-900 border rounded-xl p-5 flex flex-col items-center gap-3 text-center transition-all ${
                    highlightFirst
                      ? 'border-yellow-500/40 ring-1 ring-yellow-500/20 lg:scale-105'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8">
                    {isTop3
                      ? <Medal className={`w-7 h-7 ${medalColors[idx]}`} />
                      : <span className="text-zinc-500 font-bold text-lg">#{idx + 1}</span>
                    }
                  </div>

                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center overflow-hidden shrink-0">
                    {player.avatar_url
                      ? <img src={player.avatar_url} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                      : <span className="text-white font-black text-lg">{player.gamer_tag[0].toUpperCase()}</span>
                    }
                  </div>

                  <div className="min-w-0 w-full">
                    <p className="text-white font-bold text-sm truncate">{player.gamer_tag}</p>
                    <p className="text-zinc-500 text-xs truncate">{player.full_name}</p>
                  </div>

                  <div className="mt-auto pt-3 border-t border-zinc-800 w-full">
                    <p className={`font-display text-2xl ${highlightFirst ? 'text-yellow-400' : 'text-zinc-200'}`}>
                      {player.total_points.toLocaleString()}
                    </p>
                    <p className="text-zinc-500 text-xs">season points</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Season rankings will appear here once tournaments are completed.</p>
            <Link href="/tournaments" className="inline-flex items-center gap-1.5 mt-4 text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
              Browse tournaments <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ── ARCADE MAP ── */}
      {arcades && arcades.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-4xl text-white">ARCADES ACROSS SA</h2>
              <p className="text-zinc-500 mt-1">Every pin is a venue running NexCade events</p>
            </div>
            <Link
              href="/arcades"
              className="hidden sm:flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Explore all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <HomepageArcadeMap
            arcades={(arcades as any[])
              .filter((a) => a.latitude && a.longitude)
              .map((a) => ({
                id: a.id,
                name: a.name,
                slug: a.slug,
                city: a.city,
                latitude: a.latitude,
                longitude: a.longitude,
                games_supported: a.games_supported ?? [],
                nextTournament: null,
              }))}
          />
        </section>
      )}

      {/* ── CTA STRIP ── */}
      <section className="bg-red-600 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-5xl text-white mb-4">READY TO COMPETE?</h2>
          <p className="text-red-100 mb-8">
            Create your free NexCade ID and register for your first tournament today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className={btn.gold}>Create Account — It&apos;s Free</Link>
            <Link href="/tournaments" className={btn.ghostRed}>Browse Tournaments</Link>
          </div>
        </div>
      </section>
    </>
  );
}
