import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ArcadeProfileMap } from '@/components/ArcadeProfileMap';
import {
  MapPin,
  Mail,
  MessageCircle,
  Gamepad2,
  Monitor,
  Trophy,
  Users,
  Calendar,
  ChevronRight,
  Tv,
  Clock,
} from 'lucide-react';

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

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await serverSupabase
    .from('arcades')
    .select('name, city, description')
    .eq('slug', slug)
    .single();

  if (!data) return { title: 'Arcade Not Found' };

  const title = `${data.name} — ${data.city}`;
  const description = (data as any).description
    ?? `View tournaments and info for ${data.name} in ${data.city} on NexCade.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | NexCade`,
      description,
      url: `/arcades/${slug}`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | NexCade`,
      description,
    },
  };
}

export default async function ArcadeProfilePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: arcade } = await serverSupabase
    .from('arcades')
    .select('id, name, slug, city, address, description, contact_email, whatsapp_number, games_supported, console_setup, latitude, longitude')
    .eq('slug', slug)
    .single();

  if (!arcade) notFound();

  const [{ data: upcomingTournaments }, { count: completedCount }] = await Promise.all([
    serverSupabase
      .from('tournaments')
      .select('id, name, slug, game_type, status, start_at, entry_fee, prize_pool, max_players, is_streamed')
      .eq('arcade_id', arcade.id)
      .in('status', ['open', 'full', 'live'])
      .order('start_at', { ascending: true })
      .limit(6),
    serverSupabase
      .from('tournaments')
      .select('id', { count: 'exact', head: true })
      .eq('arcade_id', arcade.id)
      .eq('status', 'completed'),
  ]);

  const games = arcade.games_supported as string[];
  const hasMap = arcade.latitude && arcade.longitude;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* ── HEADER ── */}
      <div className="mb-10">
        {/* breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/arcades" className="hover:text-white transition-colors">Arcades</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-300">{arcade.name}</span>
        </div>

        {/* cover banner */}
        <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-red-950/30 to-zinc-900 border border-zinc-800 mb-6">
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
          <div className="absolute bottom-6 left-6 flex items-end gap-5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-2xl">{arcade.name[0]}</span>
            </div>
            <div>
              <h1 className="font-display text-4xl sm:text-5xl text-white leading-none">{arcade.name}</h1>
              <p className="text-zinc-400 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4" />
                {arcade.city}{arcade.address ? ` · ${arcade.address}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* game badges */}
        {games.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {games.map((game) => (
              <span
                key={game}
                className={`px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 border border-zinc-800 ${GAME_COLORS[game] ?? 'text-zinc-300'}`}
              >
                {game}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — tournaments + description */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* stats strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Trophy, value: completedCount ?? 0, label: 'Tournaments run' },
              { icon: Gamepad2, value: games.length, label: 'Games supported' },
              { icon: Users, value: (upcomingTournaments ?? []).length, label: 'Open now' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1 items-center text-center">
                <Icon className="w-5 h-5 text-red-500 mb-1" />
                <p className="font-display text-3xl text-white">{value}</p>
                <p className="text-zinc-500 text-xs">{label}</p>
              </div>
            ))}
          </div>

          {/* description */}
          {arcade.description && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-white font-bold text-lg mb-3">About this arcade</h2>
              <p className="text-zinc-400 leading-relaxed">{arcade.description}</p>
            </div>
          )}

          {/* console setup */}
          {arcade.console_setup && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-5 h-5 text-zinc-400" />
                <h2 className="text-white font-bold text-lg">Setup</h2>
              </div>
              <p className="text-zinc-400 leading-relaxed">{arcade.console_setup}</p>
            </div>
          )}

          {/* upcoming tournaments */}
          <div>
            <h2 className="font-display text-3xl text-white mb-6">UPCOMING TOURNAMENTS</h2>

            {!upcomingTournaments || upcomingTournaments.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
                <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No open tournaments at this arcade right now.</p>
                <p className="text-zinc-600 text-sm mt-1">Check back soon.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {upcomingTournaments.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.slug}`}
                    className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 hover:border-zinc-600 hover:shadow-lg hover:shadow-red-600/10 transition-all"
                  >
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wider ${GAME_COLORS[t.game_type] ?? 'text-zinc-400'}`}>
                            {t.game_type}
                          </span>
                          <h3 className="text-white font-bold text-base mt-0.5 group-hover:text-red-400 transition-colors">
                            {t.name}
                          </h3>
                        </div>
                        <Badge variant={STATUS_BADGE[t.status] ?? 'open'}>
                          {t.status === 'live' ? 'LIVE' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(t.start_at, 'time')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {t.max_players} spots
                        </span>
                        {t.is_streamed && (
                          <span className="flex items-center gap-1.5 text-purple-400">
                            <Tv className="w-3.5 h-3.5" /> Streamed
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 ml-auto">
                          <Clock className="w-3.5 h-3.5" />
                          <CountdownTimer targetDate={t.start_at} />
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:min-w-[90px] border-t sm:border-t-0 sm:border-l border-zinc-800 sm:pl-4 pt-3 sm:pt-0">
                      <div className="text-center">
                        <p className="text-xs text-zinc-500">Entry</p>
                        <p className="text-white font-bold">{formatCurrency(t.entry_fee)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-500">Prize</p>
                        <p className="text-yellow-400 font-bold">{formatCurrency(t.prize_pool)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — sidebar */}
        <div className="flex flex-col gap-6">

          {/* contact card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-white font-bold text-lg">Contact</h2>

            {arcade.contact_email && (
              <a
                href={`mailto:${arcade.contact_email}`}
                className="flex items-center gap-3 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="truncate">{arcade.contact_email}</span>
              </a>
            )}

            {arcade.whatsapp_number && (
              <a
                href={`https://wa.me/${arcade.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-zinc-400 hover:text-green-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-zinc-400" />
                </div>
                <span>{arcade.whatsapp_number}</span>
              </a>
            )}

            {!arcade.contact_email && !arcade.whatsapp_number && (
              <p className="text-zinc-600 text-sm">No contact info listed.</p>
            )}
          </div>

          {/* map */}
          {hasMap && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
              <h2 className="text-white font-bold text-base">Location</h2>
              <ArcadeProfileMap
                arcade={{
                  id: arcade.id,
                  name: arcade.name,
                  slug: arcade.slug,
                  city: arcade.city,
                  latitude: arcade.latitude!,
                  longitude: arcade.longitude!,
                  games_supported: games,
                  nextTournament: null,
                }}
              />
              {arcade.address && (
                <p className="text-zinc-500 text-xs">{arcade.address}</p>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-br from-red-600/20 to-zinc-900 border border-red-900/50 rounded-xl p-6 text-center">
            <Trophy className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-white font-bold mb-2">Ready to compete?</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Register for a tournament at {arcade.name} and start earning NexCade points.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
            >
              Create Account — Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
