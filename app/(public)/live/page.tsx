import type { Metadata } from 'next';
import Link from 'next/link';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StreamEmbed } from '@/components/StreamEmbed';
import {
  Tv,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Radio,
  Clock,
} from 'lucide-react';
import { LivePageCTA } from '@/components/PageRoleCTAs';

export const metadata: Metadata = {
  title: 'Live',
  description: 'Watch live NexCade tournament streams from arcades across South Africa.',
};

const GAME_COLORS: Record<string, string> = {
  FC26: 'text-orange-400',
  Tekken8: 'text-blue-400',
  SF6: 'text-yellow-400',
  MK1: 'text-pink-400',
  KOFXV: 'text-yellow-300',
  Naruto: 'text-green-400',
};

export default async function LivePage() {
  const [{ data: liveStreams }, { data: upcomingStreams }] = await Promise.all([
    serverSupabase
      .from('tournaments')
      .select('id, name, slug, game_type, status, start_at, max_players, stream_url, arcades(name, city, slug)')
      .eq('status', 'live')
      .eq('is_streamed', true)
      .order('start_at', { ascending: true }),
    serverSupabase
      .from('tournaments')
      .select('id, name, slug, game_type, status, start_at, entry_fee, max_players, is_streamed, arcades(name, city, slug)')
      .in('status', ['open', 'full'])
      .eq('is_streamed', true)
      .order('start_at', { ascending: true })
      .limit(12),
  ]);

  const live = liveStreams ?? [];
  const upcoming = upcomingStreams ?? [];
  const isLive = live.length > 0;
  const nextStream = upcoming[0] ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center gap-3 mb-10">
        <div className="relative">
          <Radio className="w-7 h-7 text-red-500" />
          {isLive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
          )}
        </div>
        <div>
          <h1 className="font-display text-5xl text-white leading-none">LIVE</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {isLive ? `${live.length} stream${live.length > 1 ? 's' : ''} live now` : 'No streams live right now'}
          </p>
        </div>
      </div>

      {/* ── LIVE STREAMS ── */}
      {isLive ? (
        <section className="mb-16">
          <div className={live.length === 1 ? 'max-w-4xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}>
            {live.map((t) => {
              const arcade = t.arcades as unknown as { name: string; city: string; slug: string } | null;
              return (
                <div key={t.id} className="flex flex-col gap-4">
                  {/* embed or placeholder */}
                  {t.stream_url ? (
                    <StreamEmbed url={t.stream_url} title={t.name} />
                  ) : (
                    <div className="w-full aspect-video bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-3">
                      <Tv className="w-10 h-10 text-zinc-700" />
                      <p className="text-zinc-500 text-sm">Stream link not yet available</p>
                    </div>
                  )}

                  {/* tournament info bar */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 border border-red-600/40">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Live</span>
                      </span>
                      <div>
                        <Link
                          href={`/tournaments/${t.slug}`}
                          className="text-white font-bold hover:text-red-400 transition-colors"
                        >
                          {t.name}
                        </Link>
                        <p className={`text-sm ${GAME_COLORS[t.game_type] ?? 'text-zinc-400'}`}>
                          {t.game_type}
                          {arcade && ` · ${arcade.name}, ${arcade.city}`}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/tournaments/${t.slug}`}
                      className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors shrink-0"
                    >
                      Tournament details <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* ── NO LIVE STREAMS PLACEHOLDER ── */
        <section className="mb-16">
          <div className="max-w-2xl mx-auto text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12">
            <div className="relative inline-block mb-6">
              <Tv className="w-16 h-16 text-zinc-700" />
            </div>
            <h2 className="font-display text-3xl text-white mb-3">NO STREAMS LIVE RIGHT NOW</h2>
            <p className="text-zinc-500 mb-6">
              NexCade tournaments are streamed live from arcades across SA. Check back soon or catch the next one.
            </p>
            <div className="mb-8">
              <LivePageCTA />
            </div>

            {nextStream ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-left">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Next stream</p>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${GAME_COLORS[nextStream.game_type] ?? 'text-zinc-400'}`}>
                      {nextStream.game_type}
                    </p>
                    <Link
                      href={`/tournaments/${nextStream.slug}`}
                      className="text-white font-bold hover:text-red-400 transition-colors"
                    >
                      {nextStream.name}
                    </Link>
                    {(() => {
                      const a = nextStream.arcades as unknown as { name: string; city: string } | null;
                      return a ? (
                        <p className="text-zinc-500 text-sm flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />{a.name} · {a.city}
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-1">Starts in</p>
                    <p className="text-white font-bold font-mono">
                      <CountdownTimer targetDate={nextStream.start_at} />
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">{formatDate(nextStream.start_at, 'time')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">No upcoming streams scheduled yet.</p>
            )}
          </div>
        </section>
      )}

      {/* ── UPCOMING STREAMS ── */}
      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-3xl text-white">UPCOMING STREAMS</h2>
            <Link
              href="/tournaments?streamed=true"
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              All tournaments <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((t) => {
              const arcade = t.arcades as unknown as { name: string; city: string; slug: string } | null;
              return (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.slug}`}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-600 hover:shadow-lg hover:shadow-red-600/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${GAME_COLORS[t.game_type] ?? 'text-zinc-400'}`}>
                        {t.game_type}
                      </span>
                      <h3 className="text-white font-bold text-sm mt-0.5 group-hover:text-red-400 transition-colors line-clamp-2">
                        {t.name}
                      </h3>
                    </div>
                    <Badge variant={t.status === 'full' ? 'full' : 'open'}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-zinc-500">
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

                  <div className="flex items-center gap-1.5 text-xs text-purple-400 border-t border-zinc-800 pt-3">
                    <Tv className="w-3.5 h-3.5" />
                    <span>Streamed</span>
                    <span className="ml-auto flex items-center gap-1 text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <CountdownTimer targetDate={t.start_at} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
