'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Trophy, Loader2, ChevronRight, Banknote,
  QrCode, Clock, CheckCircle2, Medal,
} from 'lucide-react';

type MyReg = {
  id: string;
  booking_ref: string;
  payment_status: string;
  registration_status: string;
  registered_at: string;
  checked_in_at: string | null;
  // joined
  tournament_id: string;
  tournament_name: string;
  tournament_slug: string;
  tournament_status: string;
  start_at: string;
  entry_fee: number;
  game_type: string;
  arcade_name: string;
  arcade_city: string;
  // result
  placement: number | null;
  is_winner: boolean;
};

const GAME_COLOR: Record<string, string> = {
  FC26:    'text-orange-400',
  Tekken8: 'text-blue-400',
  SF6:     'text-yellow-400',
  MK1:     'text-pink-400',
  KOFXV:   'text-yellow-300',
  Naruto:  'text-green-400',
};

const TOURNEY_STATUS: Record<string, { label: string; cls: string }> = {
  open:      { label: 'Open',      cls: 'text-green-400 bg-green-400/10 border-green-400/20'   },
  full:      { label: 'Full',      cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  live:      { label: 'Live',      cls: 'text-red-400 bg-red-400/10 border-red-400/20'          },
  completed: { label: 'Completed', cls: 'text-fg-3 bg-surface border-stroke'                    },
  cancelled: { label: 'Cancelled', cls: 'text-fg-3 bg-surface border-stroke'                    },
};

function PlacementBadge({ placement }: { placement: number | null }) {
  if (!placement) return null;
  const map: Record<number, { label: string; cls: string }> = {
    1: { label: '1st', cls: 'text-yellow-400' },
    2: { label: '2nd', cls: 'text-zinc-300'   },
    3: { label: '3rd', cls: 'text-orange-400' },
  };
  const style = map[placement] ?? { label: `${placement}th`, cls: 'text-fg-3' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-black ${style.cls}`}>
      {placement <= 3 && <Trophy className="w-3 h-3" />}
      {style.label}
    </span>
  );
}

export default function MyTournamentsPage() {
  const router = useRouter();
  const [regs, setRegs] = useState<MyReg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: regData } = await supabase
        .from('registrations')
        .select(`
          id, booking_ref, payment_status, registration_status,
          registered_at, checked_in_at, tournament_id,
          tournaments(id, name, slug, status, start_at, entry_fee, game_type,
            arcades(name, city))
        `)
        .eq('profile_id', user.id)
        .neq('registration_status', 'cancelled')
        .order('registered_at', { ascending: false });

      if (!regData) { setLoading(false); return; }

      const tourneyIds = regData.map((r) => r.tournament_id);
      const { data: resultData } = tourneyIds.length > 0
        ? await supabase
            .from('results')
            .select('tournament_id, placement, is_winner')
            .eq('profile_id', user.id)
            .in('tournament_id', tourneyIds)
        : { data: [] };

      const resultMap = new Map(
        (resultData ?? []).map((r) => [r.tournament_id, r])
      );

      const merged: MyReg[] = regData.map((r) => {
        const t = (r as any).tournaments as any;
        const arcade = t?.arcades as { name: string; city: string } | null;
        const result = resultMap.get(r.tournament_id);
        return {
          id: r.id,
          booking_ref: r.booking_ref,
          payment_status: r.payment_status,
          registration_status: r.registration_status,
          registered_at: r.registered_at,
          checked_in_at: r.checked_in_at,
          tournament_id: r.tournament_id,
          tournament_name: t?.name ?? '—',
          tournament_slug: t?.slug ?? t?.id ?? '',
          tournament_status: t?.status ?? '',
          start_at: t?.start_at ?? '',
          entry_fee: Number(t?.entry_fee ?? 0),
          game_type: t?.game_type ?? '',
          arcade_name: arcade?.name ?? '—',
          arcade_city: arcade?.city ?? '',
          placement: result?.placement ?? null,
          is_winner: result?.is_winner ?? false,
        };
      });

      setRegs(merged);
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

  const active = regs.filter((r) => ['open', 'live', 'full'].includes(r.tournament_status));
  const completed = regs.filter((r) => r.tournament_status === 'completed');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      <div className="mb-8">
        <h1 className="font-display text-3xl text-fg mb-1">MY TOURNAMENTS</h1>
        <p className="text-fg-3 text-sm">All tournaments you have registered for.</p>
      </div>

      {regs.length === 0 && (
        <div className="bg-surface border border-stroke rounded-2xl p-14 text-center">
          <Trophy className="w-8 h-8 text-fg-3 mx-auto mb-3" />
          <p className="text-fg font-semibold mb-1">No tournaments yet</p>
          <p className="text-fg-3 text-sm mb-5">Register for a tournament to see it here.</p>
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
          >
            Browse tournaments
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-fg font-bold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            Upcoming & Active
          </h2>
          <div className="flex flex-col gap-3">
            {active.map((r) => <RegCard key={r.id} reg={r} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="text-fg font-bold text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-fg-3" />
            Completed
          </h2>
          <div className="flex flex-col gap-3">
            {completed.map((r) => <RegCard key={r.id} reg={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function RegCard({ reg }: { reg: MyReg }) {
  const status = TOURNEY_STATUS[reg.tournament_status];
  const isPaid = reg.payment_status === 'paid';
  const isCheckedIn = reg.registration_status === 'checked_in';

  return (
    <Link
      href={`/tournaments/${reg.tournament_slug}`}
      className="bg-surface border border-stroke rounded-xl p-4 flex items-center gap-4 hover:border-zinc-500 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs font-bold ${GAME_COLOR[reg.game_type] ?? 'text-fg-3'}`}>
            {reg.game_type}
          </span>
          {status && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${status.cls}`}>
              {status.label}
            </span>
          )}
          {reg.placement && <PlacementBadge placement={reg.placement} />}
        </div>
        <p className="text-fg font-semibold text-sm truncate group-hover:text-red-400 transition-colors">
          {reg.tournament_name}
        </p>
        <p className="text-fg-3 text-xs mt-0.5">
          {reg.arcade_name} · {reg.arcade_city}
          {reg.start_at ? ` · ${formatDate(reg.start_at, 'short')}` : ''}
        </p>
      </div>

      <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
          isPaid ? 'text-green-400' : 'text-yellow-400'
        }`}>
          <Banknote className="w-3 h-3" />
          {isPaid ? 'Paid' : 'Pending'}
        </span>
        {isCheckedIn && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400">
            <QrCode className="w-3 h-3" />
            Checked in
          </span>
        )}
        {reg.entry_fee > 0 && (
          <span className="text-fg-3 text-xs">{formatCurrency(reg.entry_fee)}</span>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-fg-3 group-hover:text-fg-2 transition-colors shrink-0" />
    </Link>
  );
}
