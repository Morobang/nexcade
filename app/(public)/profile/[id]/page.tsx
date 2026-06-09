import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  MapPin, Trophy, Gamepad2, Star, Calendar,
  Shield, Gift, ChevronRight, Crown,
} from 'lucide-react';

type Params = Promise<{ id: string }>;

// ── Constants ────────────────────────────────────────────────────────────────

const GAME_COLOR: Record<string, string> = {
  FC26: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Tekken8: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  SF6: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  MK1: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  KOFXV: 'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
  Naruto: 'text-green-400 bg-green-400/10 border-green-400/20',
};

const GAME_DOT: Record<string, string> = {
  FC26: 'bg-orange-400', Tekken8: 'bg-blue-400', SF6: 'bg-yellow-400',
  MK1: 'bg-pink-400', KOFXV: 'bg-yellow-300', Naruto: 'bg-green-400',
};

const TIERS = [
  { min: 0,  label: 'Rookie',    color: 'text-zinc-400',   border: 'border-zinc-600',    bg: 'bg-zinc-800'      },
  { min: 3,  label: 'Contender', color: 'text-green-400',  border: 'border-green-600/50', bg: 'bg-green-900/20' },
  { min: 10, label: 'Veteran',   color: 'text-blue-400',   border: 'border-blue-600/50',  bg: 'bg-blue-900/20'  },
  { min: 25, label: 'Elite',     color: 'text-yellow-400', border: 'border-yellow-600/50', bg: 'bg-yellow-900/20'},
];

function getTier(entered: number) {
  return [...TIERS].reverse().find((t) => entered >= t.min) ?? TIERS[0];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await serverSupabase.from('profiles').select('gamer_tag, full_name').eq('id', id).single();
  if (!data) return { title: 'Player Not Found' };

  const title = `${data.gamer_tag} — NexCade Profile`;
  const description = `${data.full_name}'s NexCade tournament history, rankings, and stats.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | NexCade`,
      description,
      url: `/profile/${id}`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | NexCade`,
      description,
    },
  };
}

export default async function PublicProfilePage({ params }: { params: Params }) {
  const { id } = await params;

  const { data: profile } = await serverSupabase
    .from('profiles')
    .select('id, full_name, gamer_tag, avatar_url, bio, home_arcade_id, arcades(name, city, slug)')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  const [
    { data: regData },
    { data: resultData },
    { data: seasonData },
    { data: qualifierData },
  ] = await Promise.all([
    serverSupabase
      .from('registrations')
      .select('id, registered_at, payment_status, character_1, tournaments(id, name, slug, game_type, status, start_at, prize_pool, arcades(name, city))')
      .eq('profile_id', id)
      .neq('registration_status', 'cancelled')
      .order('registered_at', { ascending: false }),
    serverSupabase
      .from('results')
      .select('placement, is_winner, points_awarded, tournament_id')
      .eq('profile_id', id),
    serverSupabase
      .from('season_points')
      .select('points, season, is_season_champion')
      .eq('profile_id', id),
    serverSupabase
      .from('results')
      .select('placement, tournaments!inner(is_qualifier)')
      .eq('profile_id', id)
      .lte('placement', 2),
  ]);

  const registrations = regData ?? [];
  const results = resultData ?? [];
  const seasonRows = seasonData ?? [];

  // Stats
  const totalEntered = registrations.length;
  const wins = results.filter((r) => r.is_winner).length;
  const winRate = results.length > 0 ? Math.round((wins / results.length) * 100) : 0;
  const totalSeasonPoints = seasonRows.reduce((s, r) => s + r.points, 0);
  const isSeasonChampion = (seasonRows as any[]).some((r) => r.is_season_champion === true);
  const isGrandFinalQualified = (qualifierData ?? []).some(
    (r) => (r as any).tournaments?.is_qualifier === true
  );
  const paidCount = registrations.filter((r) => r.payment_status === 'paid').length;
  const loyaltyProgress = paidCount % 3;
  const tier = getTier(totalEntered);

  // Game mains — count by game_type across all registrations
  const gameCounts: Record<string, number> = {};
  for (const r of registrations) {
    const game = (r.tournaments as any)?.game_type;
    if (game) gameCounts[game] = (gameCounts[game] ?? 0) + 1;
  }
  const gameMains = Object.entries(gameCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([game, count]) => ({ game, count }));

  // Results keyed by tournament_id
  const resultByTournament = new Map(results.map((r) => [r.tournament_id, r]));

  const arcade = (profile as any).arcades as { name: string; city: string; slug: string } | null;
  const initials = profile.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-5">

          {/* Identity card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center mb-4 shadow-lg shadow-red-600/20">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />  // eslint-disable-line @next/next/no-img-element
                : <span className="text-white font-black text-2xl">{initials}</span>}
            </div>
            <p className="font-display text-3xl text-white leading-none">{profile.gamer_tag}</p>
            <p className="text-zinc-400 text-sm mt-1">{profile.full_name}</p>

            {/* Loyalty tier */}
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tier.color} ${tier.border} ${tier.bg}`}>
              <Shield className="w-3 h-3" />
              {tier.label}
            </div>

            {/* Grand Final qualifier badge */}
            {isGrandFinalQualified && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border text-purple-400 border-purple-500/40 bg-purple-500/10">
                <Shield className="w-3 h-3" />
                Grand Final Qualified
              </div>
            )}

            {/* Season champion badge */}
            {isSeasonChampion && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border text-yellow-400 border-yellow-500/40 bg-yellow-500/10">
                <Crown className="w-3 h-3" />
                Season Champion
              </div>
            )}

            {arcade && (
              <Link
                href={`/arcades/${arcade.slug}`}
                className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {arcade.name} · {arcade.city}
              </Link>
            )}

            {profile.bio && (
              <p className="mt-4 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800 pt-4">{profile.bio}</p>
            )}
          </div>

          {/* Game mains */}
          {gameMains.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Game Mains</h3>
              <div className="flex flex-col gap-2">
                {gameMains.map(({ game, count }) => (
                  <div key={game} className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${GAME_COLOR[game] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${GAME_DOT[game] ?? 'bg-zinc-500'}`} />
                      {game}
                    </span>
                    <span className="text-zinc-500 text-xs">{count} tournament{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loyalty bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-red-400" />
              <h3 className="text-white font-bold text-sm">Loyalty Progress</h3>
            </div>
            <div className="flex gap-2 mb-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${i < loyaltyProgress ? 'bg-red-500' : 'bg-zinc-800'}`} />
              ))}
            </div>
            <p className="text-xs text-zinc-600">{loyaltyProgress}/3 toward next free entry · {Math.floor(paidCount / 3)} earned</p>
          </div>

          {/* Achievements placeholder */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Achievements</h3>
            <p className="text-zinc-600 text-xs">Badges and achievements coming soon.</p>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Gamepad2, label: 'Played',    value: totalEntered,        color: 'text-blue-400'   },
              { icon: Trophy,   label: 'Wins',      value: wins,                color: 'text-yellow-400' },
              { icon: Star,     label: 'Win rate',  value: `${winRate}%`,        color: 'text-red-400'   },
              { icon: Shield,   label: 'Pts',       value: totalSeasonPoints,   color: 'text-purple-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Tournament history */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Tournament History</h2>
            </div>

            {registrations.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No tournaments entered yet.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {registrations.map((r) => {
                  const t = (r as any).tournaments as {
                    id: string; name: string; slug: string; game_type: string;
                    status: string; start_at: string; prize_pool: number;
                    arcades: { name: string; city: string } | null;
                  } | null;
                  if (!t) return null;
                  const result = resultByTournament.get(t.id);
                  const arcadeInfo = t.arcades;
                  return (
                    <div key={r.id} className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`text-xs font-bold ${(GAME_COLOR[t.game_type] ?? '').split(' ')[0] ?? 'text-zinc-400'}`}>
                            {t.game_type}
                          </span>
                          {t.status === 'completed' && result?.is_winner && (
                            <span className="text-xs text-yellow-400 font-bold">Winner</span>
                          )}
                        </div>
                        <Link
                          href={`/tournaments/${t.slug}`}
                          className="text-zinc-200 text-sm font-semibold hover:text-white transition-colors line-clamp-1"
                        >
                          {t.name}
                        </Link>
                        <div className="flex gap-3 mt-0.5 text-xs text-zinc-600">
                          {arcadeInfo && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{arcadeInfo.city}</span>}
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(t.start_at, 'short')}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {result ? (
                          <>
                            <p className={`text-sm font-black ${result.placement === 1 ? 'text-yellow-400' : result.placement === 2 ? 'text-zinc-300' : result.placement === 3 ? 'text-orange-400' : 'text-zinc-500'}`}>
                              {result.placement === 1 ? '1st' : result.placement === 2 ? '2nd' : result.placement === 3 ? '3rd' : `${result.placement}th`}
                            </p>
                            {result.points_awarded > 0 && (
                              <p className="text-xs text-zinc-600">+{result.points_awarded}pts</p>
                            )}
                          </>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${t.status === 'completed' ? 'text-zinc-500 border-zinc-700' : 'text-green-400 bg-green-400/10 border-green-400/20'}`}>
                            {t.status === 'completed' ? 'No result' : 'Upcoming'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Season points breakdown */}
          {seasonRows.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Season Points</h2>
              <div className="flex flex-col gap-2">
                {seasonRows.map((s) => (
                  <div key={s.season} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Season {s.season}</span>
                    <span className="text-purple-400 font-bold">{s.points} pts</span>
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
