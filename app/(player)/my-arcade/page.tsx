'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Building2, Trophy, ChevronRight, Loader2, MapPin } from 'lucide-react';

type ArcadeInfo = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  slug: string;
};

type Tournament = {
  id: string;
  name: string;
  slug: string;
  game_type: string;
  status: string;
  start_at: string;
  entry_fee: number;
  max_players: number;
};

const GAME_COLOR: Record<string, string> = {
  FC26:    'text-orange-400',
  Tekken8: 'text-blue-400',
  SF6:     'text-yellow-400',
  MK1:     'text-pink-400',
  KOFXV:   'text-yellow-300',
  Naruto:  'text-green-400',
};

const STATUS_STYLE: Record<string, string> = {
  open: 'text-green-400 bg-green-400/10 border-green-400/20',
  full: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  live: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function MyArcadePage() {
  const router = useRouter();
  const [arcade, setArcade] = useState<ArcadeInfo | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [noArcade, setNoArcade] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('home_arcade_id')
        .eq('id', user.id)
        .single();

      if (!profile?.home_arcade_id) {
        setNoArcade(true);
        setLoading(false);
        return;
      }

      const [arcadeRes, tourneysRes] = await Promise.all([
        supabase
          .from('arcades')
          .select('id, name, city, address, slug')
          .eq('id', profile.home_arcade_id)
          .single(),
        supabase
          .from('tournaments')
          .select('id, name, slug, game_type, status, start_at, entry_fee, max_players')
          .eq('arcade_id', profile.home_arcade_id)
          .in('status', ['open', 'live', 'full'])
          .order('start_at', { ascending: true })
          .limit(20),
      ]);

      setArcade(arcadeRes.data as ArcadeInfo | null);
      setTournaments((tourneysRes.data ?? []) as Tournament[]);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 text-fg-3 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-fg-3 hover:text-fg-2 text-sm transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <h1 className="font-display text-3xl text-fg mb-1">MY ARCADE</h1>
      <p className="text-fg-3 text-sm mb-8">Upcoming events at your home arcade.</p>

      {noArcade && (
        <div className="bg-surface border border-stroke rounded-2xl p-10 text-center">
          <Building2 className="w-8 h-8 text-fg-3 mx-auto mb-3" />
          <p className="text-fg font-semibold mb-1">No home arcade set</p>
          <p className="text-fg-3 text-sm mb-5">Set your home arcade in settings to see events here.</p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
          >
            Go to settings
          </Link>
        </div>
      )}

      {arcade && (
        <>
          <div className="bg-surface border border-stroke rounded-xl p-5 mb-8 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-elevated border border-stroke flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-fg font-bold text-lg">{arcade.name}</p>
              <p className="text-fg-3 text-sm flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {arcade.city}{arcade.address ? ` · ${arcade.address}` : ''}
              </p>
            </div>
            <Link
              href={`/arcades/${arcade.slug}`}
              className="text-fg-3 hover:text-red-400 text-xs font-semibold transition-colors shrink-0"
            >
              View page
            </Link>
          </div>

          <h2 className="text-fg font-bold text-sm mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-red-500" />
            Upcoming Events
          </h2>

          {tournaments.length === 0 && (
            <div className="bg-surface border border-stroke rounded-2xl p-10 text-center">
              <Trophy className="w-7 h-7 text-fg-3 mx-auto mb-3" />
              <p className="text-fg-3 text-sm">No upcoming tournaments at {arcade.name} right now.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug ?? t.id}`}
                className="bg-surface border border-stroke rounded-xl p-4 flex items-center gap-4 hover:border-zinc-500 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${GAME_COLOR[t.game_type] ?? 'text-fg-3'}`}>{t.game_type}</span>
                    {STATUS_STYLE[t.status] && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${STATUS_STYLE[t.status]}`}>
                        {t.status}
                      </span>
                    )}
                  </div>
                  <p className="text-fg font-semibold text-sm truncate group-hover:text-red-400 transition-colors">{t.name}</p>
                  <p className="text-fg-3 text-xs mt-0.5">{formatDate(t.start_at, 'short')}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-fg-2 text-sm font-semibold">
                    {t.entry_fee === 0 ? 'Free' : formatCurrency(t.entry_fee)}
                  </p>
                  <p className="text-fg-3 text-xs mt-0.5">{t.max_players} slots</p>
                </div>
                <ChevronRight className="w-4 h-4 text-fg-3 group-hover:text-fg-2 shrink-0" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
