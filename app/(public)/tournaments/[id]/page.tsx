import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/CountdownTimer';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Clock,
  Tv,
  ScrollText,
  Gamepad2,
  ChevronRight,
} from 'lucide-react';

const GAME_COLORS: Record<string, string> = {
  FC26: '#f97316',
  Tekken8: '#3b82f6',
  SF6: '#eab308',
  MK1: '#ec4899',
  KOFXV: '#fde047',
  Naruto: '#22c55e',
};

const GAME_TEXT: Record<string, string> = {
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

const FORMAT_LABELS: Record<string, string> = {
  knockout: 'Single Elimination',
  group_ko: 'Group Stage + Knockout',
  league: 'League (Round Robin)',
};

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id: slug } = await params;
  const { data } = await serverSupabase
    .from('tournaments')
    .select('name, game_type, arcades(city)')
    .eq('slug', slug)
    .single();
  if (!data) return { title: 'Tournament Not Found' };
  return {
    title: data.name,
    description: `${data.game_type} tournament at ${(data as any).arcades?.city ?? 'SA'}. Register on NexCade.`,
  };
}

export default async function TournamentDetailPage({ params }: { params: Params }) {
  const { id: slug } = await params;

  const { data: tournament } = await serverSupabase
    .from('tournaments')
    .select(`
      id, name, slug, game_type, format, status,
      description, rules, start_at, end_at,
      entry_fee, prize_pool, max_players,
      is_streamed, stream_url, venue,
      registration_deadline, arcade_id,
      arcades(id, name, slug, city, address)
    `)
    .eq('slug', slug)
    .single();

  if (!tournament) notFound();

  const arcade = (tournament as any).arcades as {
    id: string; name: string; slug: string; city: string; address?: string;
  } | null;

  const [{ data: regData }, { data: relatedRaw }] = await Promise.all([
    serverSupabase
      .from('registrations')
      .select('id, profiles(gamer_tag, full_name)')
      .eq('tournament_id', tournament.id)
      .neq('registration_status', 'cancelled'),
    arcade
      ? serverSupabase
          .from('tournaments')
          .select('id, name, slug, game_type, status, start_at, entry_fee, prize_pool')
          .eq('arcade_id', tournament.arcade_id)
          .neq('id', tournament.id)
          .neq('status', 'cancelled')
          .order('start_at', { ascending: true })
          .limit(3)
      : Promise.resolve({ data: [] }),
  ]);

  const registrations = regData ?? [];
  const related = relatedRaw ?? [];
  const registered = registrations.length;
  const spotsLeft = tournament.max_players - registered;
  const spotsPercent = Math.min(100, Math.round((registered / tournament.max_players) * 100));
  const barColor =
    spotsPercent >= 80 ? 'bg-red-500' : spotsPercent >= 50 ? 'bg-yellow-500' : 'bg-green-500';
  const accentColor = GAME_COLORS[tournament.game_type] ?? '#71717a';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All Tournaments
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── MAIN CONTENT ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Hero card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="h-1.5 w-full" style={{ background: accentColor }} />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className={`text-sm font-bold uppercase tracking-wider ${GAME_TEXT[tournament.game_type] ?? 'text-zinc-400'}`}>
                    {tournament.game_type}
                  </span>
                  <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight mt-1">
                    {tournament.name}
                  </h1>
                </div>
                <Badge variant={STATUS_BADGE[tournament.status] ?? 'open'}>
                  {tournament.status === 'live' ? 'LIVE' : tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
                {arcade && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <Link href={`/arcades/${arcade.slug}`} className="hover:text-white transition-colors">
                      {arcade.name}
                    </Link>
                    <span>· {arcade.city}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  {formatDate(tournament.start_at, 'time')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-zinc-500" />
                  {FORMAT_LABELS[tournament.format] ?? tournament.format}
                </span>
              </div>

              {tournament.description && (
                <p className="mt-5 text-zinc-300 leading-relaxed">{tournament.description}</p>
              )}
            </div>
          </div>

          {/* Live stream embed */}
          {tournament.status === 'live' && tournament.stream_url && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Live Stream</span>
              </div>
              <div className="aspect-video">
                <iframe
                  src={tournament.stream_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Rules */}
          {tournament.rules && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="flex items-center gap-2 font-bold text-white text-lg mb-4">
                <ScrollText className="w-5 h-5 text-zinc-500" /> Tournament Rules
              </h2>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{tournament.rules}</p>
            </div>
          )}

          {/* Registered players */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="flex items-center gap-2 font-bold text-white text-lg mb-4">
              <Users className="w-5 h-5 text-zinc-500" />
              Registered Players
              <span className="text-sm font-normal text-zinc-500 ml-1">({registered}/{tournament.max_players})</span>
            </h2>

            {registrations.length === 0 ? (
              <p className="text-zinc-500 text-sm">No registrations yet. Be the first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {registrations.map((reg) => {
                  const profile = (reg as any).profiles as { gamer_tag: string; full_name: string } | null;
                  if (!profile) return null;
                  return (
                    <span
                      key={reg.id}
                      className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 font-medium"
                    >
                      {profile.gamer_tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="flex flex-col gap-5">
          {/* Register CTA */}
          {tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Entry fee</span>
                <span className="text-white font-bold text-lg">{formatCurrency(tournament.entry_fee)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Prize pool</span>
                <span className="text-yellow-400 font-bold text-lg">{formatCurrency(tournament.prize_pool)}</span>
              </div>

              <div className="mt-1">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <span>{registered} registered</span>
                  <span>{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${spotsPercent}%` }} />
                </div>
              </div>

              {spotsLeft > 0 ? (
                <Link
                  href={`/register/${tournament.id}`}
                  className="mt-1 w-full text-center py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                >
                  Register Now
                </Link>
              ) : (
                <button disabled className="mt-1 w-full py-3 rounded-lg bg-zinc-800 text-zinc-500 font-bold cursor-not-allowed">
                  Tournament Full
                </button>
              )}

              {tournament.registration_deadline && (
                <p className="text-xs text-zinc-600 text-center">
                  Registration closes {formatDate(tournament.registration_deadline, 'time')}
                </p>
              )}
            </div>
          )}

          {/* View bracket */}
          <Link
            href={`/tournaments/${tournament.slug}/bracket`}
            className="flex items-center justify-between px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
              <Trophy className="w-4 h-4 text-yellow-400" />
              View Bracket
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </Link>

          {/* Key info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Event Info</h3>

            {[
              { icon: Calendar, label: 'Date & time', value: formatDate(tournament.start_at, 'time') },
              { icon: Clock, label: 'Format', value: FORMAT_LABELS[tournament.format] ?? tournament.format },
              { icon: Users, label: 'Max players', value: String(tournament.max_players) },
              ...(tournament.venue ? [{ icon: MapPin, label: 'Venue', value: tournament.venue }] : []),
              ...(arcade ? [{ icon: MapPin, label: 'Arcade', value: `${arcade.name}, ${arcade.city}` }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Icon className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-zinc-500 text-xs">{label}</p>
                  <p className="text-zinc-200">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Countdown */}
          {tournament.status === 'open' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center gap-3">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Time until start</p>
              <CountdownTimer targetDate={tournament.start_at} />
            </div>
          )}

          {/* Stream info (not live yet) */}
          {tournament.is_streamed && tournament.status !== 'live' && (
            <div className="bg-zinc-900 border border-purple-900/50 rounded-xl p-5 flex items-start gap-3">
              <Tv className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-300 font-semibold text-sm">This event will be streamed</p>
                <p className="text-zinc-500 text-xs mt-1">A live stream will appear here when the event starts.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related tournaments */}
      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-3xl text-white mb-6">
            MORE FROM {arcade?.name.toUpperCase() ?? 'THIS ARCADE'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug}`}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-600 transition-all"
              >
                <span className={`text-xs font-bold uppercase tracking-wider ${GAME_TEXT[t.game_type] ?? 'text-zinc-400'}`}>
                  {t.game_type}
                </span>
                <h3 className="text-white font-bold group-hover:text-red-400 transition-colors line-clamp-2 text-sm">
                  {t.name}
                </h3>
                <div className="flex items-center justify-between mt-auto text-xs text-zinc-500">
                  <span>{formatDate(t.start_at, 'short')}</span>
                  <span className="text-yellow-400 font-semibold">{formatCurrency(t.prize_pool)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
