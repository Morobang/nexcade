'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft, Loader2, Trophy, Users, Banknote,
  CheckCircle2, Clock, XCircle, Crown, Gamepad2,
} from 'lucide-react';

type Registration = {
  id: string;
  profile_id: string;
  booking_ref: string;
  registration_status: string;
  payment_status: string;
  registered_at: string;
  character_1: string | null;
  team_name: string | null;
  gamer_tag: string;
  full_name: string;
  phone: string | null;
  is_winner: boolean | null;
};

type Tournament = {
  id: string;
  name: string;
  game_type: string;
  format: string;
  status: string;
  start_at: string;
  entry_fee: number;
  max_players: number;
  prize_pool: number;
  slug: string;
};

export default function AdminTournamentDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (!['arcade_owner', 'platform_admin'].includes(profile?.role ?? '')) {
        router.replace('/dashboard'); return;
      }

      const [tRes, rRes] = await Promise.all([
        supabase
          .from('tournaments')
          .select('id, name, game_type, format, status, start_at, entry_fee, max_players, prize_pool, slug')
          .eq('id', id)
          .single(),
        supabase
          .from('registrations')
          .select('id, profile_id, booking_ref, registration_status, payment_status, registered_at, character_1, team_name, profiles(gamer_tag, full_name, phone)')
          .eq('tournament_id', id)
          .neq('registration_status', 'cancelled')
          .order('registered_at', { ascending: true }),
      ]);

      const results = await supabase
        .from('results')
        .select('profile_id')
        .eq('tournament_id', id)
        .eq('is_winner', true);

      const winnerIds = new Set((results.data ?? []).map((r) => r.profile_id));

      setTournament(tRes.data as Tournament | null);
      setRegistrations((rRes.data ?? []).map((r) => {
        const p = (r as any).profiles as { gamer_tag: string; full_name: string; phone: string | null } | null;
        return {
          id: r.id,
          profile_id: r.profile_id,
          booking_ref: r.booking_ref,
          registration_status: r.registration_status,
          payment_status: r.payment_status,
          registered_at: r.registered_at,
          character_1: r.character_1,
          team_name: r.team_name,
          gamer_tag: p?.gamer_tag ?? '—',
          full_name: p?.full_name ?? '—',
          phone: p?.phone ?? null,
          is_winner: winnerIds.has(r.profile_id),
        };
      }));
      setLoading(false);
    }
    load();
  }, [router, id]);

  async function markPaid(regId: string) {
    setActionLoading(regId);
    await supabase.from('registrations').update({ payment_status: 'paid' }).eq('id', regId);
    setRegistrations((prev) => prev.map((r) => r.id === regId ? { ...r, payment_status: 'paid' } : r));
    setActionLoading(null);
  }

  async function markCheckedIn(regId: string) {
    setActionLoading(regId);
    await supabase.from('registrations').update({ registration_status: 'checked_in' }).eq('id', regId);
    setRegistrations((prev) => prev.map((r) => r.id === regId ? { ...r, registration_status: 'checked_in' } : r));
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 text-fg-3 animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-fg-3">Tournament not found.</p>
      </div>
    );
  }

  const paidCount = registrations.filter((r) => r.payment_status === 'paid').length;
  const checkedInCount = registrations.filter((r) => r.registration_status === 'checked_in').length;
  const revenue = paidCount * Number(tournament.entry_fee);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      <Link
        href="/admin/tournaments"
        className="inline-flex items-center gap-1.5 text-fg-3 hover:text-fg-2 text-sm transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tournaments
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="w-4 h-4 text-fg-3" />
            <span className="text-fg-3 text-xs">{tournament.game_type} · {tournament.format}</span>
          </div>
          <h1 className="font-display text-3xl text-fg mb-1">{tournament.name.toUpperCase()}</h1>
          <p className="text-fg-3 text-sm">{formatDate(tournament.start_at, 'long')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/tournaments/${id}/groups`}
            className="px-3 py-2 rounded-xl bg-elevated border border-stroke text-fg-2 text-sm font-semibold hover:border-fg-2 transition-colors"
          >
            Group Stage
          </Link>
          <Link
            href={`/tournaments/${tournament.slug ?? id}`}
            target="_blank"
            className="px-3 py-2 rounded-xl bg-elevated border border-stroke text-fg-2 text-sm font-semibold hover:border-fg-2 transition-colors"
          >
            Public page
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users,       label: 'Registered',  value: `${registrations.length}/${tournament.max_players}`, color: 'text-fg'         },
          { icon: CheckCircle2, label: 'Paid',       value: paidCount,                                            color: 'text-green-400'  },
          { icon: Trophy,      label: 'Checked in',  value: checkedInCount,                                       color: 'text-blue-400'   },
          { icon: Banknote,    label: 'Revenue',     value: formatCurrency(revenue),                              color: 'text-red-400'    },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-surface border border-stroke rounded-xl p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-fg-3 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Registrations table */}
      <div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke flex items-center justify-between">
          <h2 className="text-fg font-bold text-sm">Registrations ({registrations.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-stroke">
                {['Player', 'Ref', 'Character', 'Payment', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-fg-3 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke">
              {registrations.map((r) => (
                <tr key={r.id} className={`hover:bg-elevated/50 transition-colors ${r.is_winner ? 'bg-yellow-400/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.is_winner && <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                      <div>
                        <p className="text-fg font-semibold text-sm">{r.gamer_tag}</p>
                        <p className="text-fg-3 text-xs">{r.full_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-fg-3 text-xs font-mono">{r.booking_ref}</td>
                  <td className="px-4 py-3 text-fg-3 text-xs">{r.character_1 ?? r.team_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      r.payment_status === 'paid'
                        ? 'text-green-400 bg-green-400/10 border-green-400/20'
                        : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                    }`}>
                      {r.payment_status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {r.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      r.registration_status === 'checked_in'
                        ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                        : 'text-fg-3 bg-elevated border-stroke'
                    }`}>
                      {r.registration_status === 'checked_in' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {r.registration_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {r.payment_status !== 'paid' && (
                        <button
                          onClick={() => markPaid(r.id)}
                          disabled={actionLoading === r.id}
                          className="px-2 py-1 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-xs font-semibold disabled:opacity-50"
                        >
                          {actionLoading === r.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null}
                          Mark paid
                        </button>
                      )}
                      {r.registration_status !== 'checked_in' && (
                        <button
                          onClick={() => markCheckedIn(r.id)}
                          disabled={actionLoading === r.id}
                          className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 text-xs font-semibold disabled:opacity-50"
                        >
                          Check in
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {registrations.length === 0 && (
            <div className="p-10 text-center">
              <Users className="w-7 h-7 text-fg-3 mx-auto mb-3" />
              <p className="text-fg-3 text-sm">No registrations yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
