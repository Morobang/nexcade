'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import { calculatePlacementPoints, getCurrentSeasonName } from '@/lib/points';
import {
  Loader2, AlertCircle, ArrowLeft, Search, Filter,
  Download, CheckCircle2, Banknote, Trophy, Medal,
  MessageCircle, QrCode, X, Users, FlagTriangleRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Arcade = { id: string; name: string };

type RegRow = {
  id: string;
  tournament_id: string;
  profile_id: string;
  booking_ref: string;
  registration_status: string;
  payment_status: string;
  registered_at: string;
  paid_at: string | null;
  checked_in_at: string | null;
  character_1: string | null;
  character_2: string | null;
  character_3: string | null;
  team_name: string | null;
  team_type: string | null;
  // joined
  full_name: string;
  gamer_tag: string;
  phone: string | null;
  tournament_name: string;
  game_type: string;
  // from results
  placement: number | null;
  is_winner: boolean;
  result_id: string | null;
};

type TournamentOption = { id: string; name: string; game_type: string };

// ── Constants ──────────────────────────────────────────────────────────────────

const GAME_COLOR: Record<string, string> = {
  FC26:    'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Tekken8: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  SF6:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  MK1:     'text-pink-400 bg-pink-400/10 border-pink-400/20',
  KOFXV:   'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
  Naruto:  'text-green-400 bg-green-400/10 border-green-400/20',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsertSeasonPoints(tournamentId: string, profileId: string, points: number) {
  const season = getCurrentSeasonName();
  const { data: existing } = await supabase
    .from('season_points')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('season_points')
      .update({ points, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('season_points')
      .insert({ tournament_id: tournamentId, profile_id: profileId, season, points });
  }
}

function buildWhatsApp(phone: string | null, gamerTag: string, tournamentName: string, bookingRef: string) {
  if (!phone) return null;
  const number = phone.replace(/\D/g, '');
  const msg = encodeURIComponent(
    `Hi ${gamerTag}, your registration for *${tournamentName}* is confirmed.\nBooking ref: ${bookingRef}\n\nSee you there!`
  );
  return `https://wa.me/${number}?text=${msg}`;
}

function exportCSV(rows: RegRow[]) {
  const headers = [
    'Name', 'Gamer Tag', 'Phone', 'Tournament', 'Game',
    'Characters', 'Team', 'Payment', 'Status', 'Placement',
    'Booking Ref', 'Registered At',
  ];
  const data = rows.map((r) => [
    r.full_name,
    r.gamer_tag,
    r.phone ?? '',
    r.tournament_name,
    r.game_type,
    [r.character_1, r.character_2, r.character_3].filter(Boolean).join(' / '),
    r.team_name ? `${r.team_name}${r.team_type ? ` (${r.team_type})` : ''}` : '',
    r.payment_status,
    r.registration_status,
    r.placement ? `${r.placement}` : '',
    r.booking_ref,
    formatDate(r.registered_at, 'short'),
  ]);
  const csv = [headers, ...data]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registrations-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const [arcade, setArcade] = useState<Arcade | null>(null);
  const [rows, setRows] = useState<RegRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterTournament, setFilterTournament] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  // Optimistic action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadData = useCallback(async (arcadeId: string) => {
    // Fetch tournaments for this arcade
    const { data: tourneyData } = await supabase
      .from('tournaments')
      .select('id, name, game_type')
      .eq('arcade_id', arcadeId)
      .order('start_at', { ascending: false });

    const tourneysMap = new Map((tourneyData ?? []).map((t) => [t.id, t]));
    setTournaments(tourneyData ?? []);

    if (!tourneyData || tourneyData.length === 0) {
      setRows([]);
      return;
    }

    const tourneyIds = tourneyData.map((t) => t.id);

    // Fetch registrations with profiles
    const { data: regData } = await supabase
      .from('registrations')
      .select(`
        id, tournament_id, profile_id, booking_ref,
        registration_status, payment_status,
        registered_at, paid_at, checked_in_at,
        character_1, character_2, character_3,
        team_name, team_type,
        profiles(full_name, gamer_tag, phone)
      `)
      .in('tournament_id', tourneyIds)
      .neq('registration_status', 'cancelled')
      .order('registered_at', { ascending: false });

    // Fetch results for winner/placement info
    const { data: resultData } = await supabase
      .from('results')
      .select('id, tournament_id, profile_id, placement, is_winner')
      .in('tournament_id', tourneyIds);

    const resultMap = new Map(
      (resultData ?? []).map((r) => [`${r.tournament_id}-${r.profile_id}`, r])
    );

    const merged: RegRow[] = (regData ?? []).map((r) => {
      const profile = (r as any).profiles as { full_name: string; gamer_tag: string; phone: string | null } | null;
      const tourney = tourneysMap.get(r.tournament_id);
      const result = resultMap.get(`${r.tournament_id}-${r.profile_id}`);
      return {
        id: r.id,
        tournament_id: r.tournament_id,
        profile_id: r.profile_id,
        booking_ref: r.booking_ref,
        registration_status: r.registration_status,
        payment_status: r.payment_status,
        registered_at: r.registered_at,
        paid_at: r.paid_at,
        checked_in_at: r.checked_in_at,
        character_1: r.character_1,
        character_2: r.character_2,
        character_3: r.character_3,
        team_name: r.team_name,
        team_type: r.team_type,
        full_name: profile?.full_name ?? '—',
        gamer_tag: profile?.gamer_tag ?? '—',
        phone: profile?.phone ?? null,
        tournament_name: tourney?.name ?? '—',
        game_type: tourney?.game_type ?? '—',
        placement: result?.placement ?? null,
        is_winner: result?.is_winner ?? false,
        result_id: result?.id ?? null,
      };
    });

    setRows(merged);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (!profile || !['arcade_owner', 'platform_admin'].includes(profile.role)) {
        setUnauthorized(true); setLoading(false); return;
      }

      const { data: arcadeData } = await supabase
        .from('arcades').select('id, name').eq('owner_id', user.id).single();

      if (!arcadeData) { setUnauthorized(true); setLoading(false); return; }

      setArcade(arcadeData);
      await loadData(arcadeData.id);
      setLoading(false);
    }
    init();
  }, [router, loadData]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function markPaid(reg: RegRow) {
    setActionLoading(`paid-${reg.id}`);
    await supabase
      .from('registrations')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', reg.id);
    setRows((prev) =>
      prev.map((r) => r.id === reg.id ? { ...r, payment_status: 'paid', paid_at: new Date().toISOString() } : r)
    );
    setActionLoading(null);
  }

  async function checkIn(reg: RegRow) {
    setActionLoading(`checkin-${reg.id}`);
    await supabase
      .from('registrations')
      .update({ registration_status: 'checked_in', checked_in_at: new Date().toISOString() })
      .eq('id', reg.id);
    setRows((prev) =>
      prev.map((r) => r.id === reg.id ? { ...r, registration_status: 'checked_in', checked_in_at: new Date().toISOString() } : r)
    );
    setActionLoading(null);
  }

  async function setPlacement(reg: RegRow, placement: number) {
    setActionLoading(`place-${reg.id}`);
    const isWinner = placement === 1;
    const { points } = calculatePlacementPoints(placement);

    if (reg.result_id) {
      await supabase
        .from('results')
        .update({ placement, is_winner: isWinner, points_awarded: points })
        .eq('id', reg.result_id);
      setRows((prev) =>
        prev.map((r) => r.id === reg.id ? { ...r, placement, is_winner: isWinner } : r)
      );
    } else {
      const { data } = await supabase
        .from('results')
        .insert({ tournament_id: reg.tournament_id, profile_id: reg.profile_id, placement, is_winner: isWinner, points_awarded: points })
        .select('id')
        .single();
      setRows((prev) =>
        prev.map((r) => r.id === reg.id ? { ...r, placement, is_winner: isWinner, result_id: data?.id ?? null } : r)
      );
    }

    // Award season points for this player
    await upsertSeasonPoints(reg.tournament_id, reg.profile_id, points);

    setActionLoading(null);
  }

  async function completeTournament(tournamentId: string) {
    setActionLoading(`complete-${tournamentId}`);

    // Mark tournament completed
    await supabase.from('tournaments').update({ status: 'completed' }).eq('id', tournamentId);

    // Award 10 participation points to all players who don't already have season_points
    const participants = rows.filter((r) => r.tournament_id === tournamentId);
    const { points: participationPts } = calculatePlacementPoints(99); // 99 = no placement = 0 from table, use 10 directly
    const season = getCurrentSeasonName();

    for (const p of participants) {
      const { data: existing } = await supabase
        .from('season_points')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('profile_id', p.profile_id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('season_points').insert({
          tournament_id: tournamentId,
          profile_id: p.profile_id,
          season,
          points: 10,
        });
      }
    }

    setActionLoading(null);
  }

  // ── Filtered rows ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (q && !r.full_name.toLowerCase().includes(q) && !r.gamer_tag.toLowerCase().includes(q) && !r.booking_ref.toLowerCase().includes(q)) return false;
      if (filterTournament && r.tournament_id !== filterTournament) return false;
      if (filterGame && r.game_type !== filterGame) return false;
      if (filterPayment && r.payment_status !== filterPayment) return false;
      return true;
    });
  }, [rows, search, filterTournament, filterGame, filterPayment]);

  const uniqueGames = useMemo(() => [...new Set(rows.map((r) => r.game_type))], [rows]);

  const hasFilters = search || filterTournament || filterGame || filterPayment;

  // ── Render guards ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-white mb-2">ACCESS DENIED</h1>
          <p className="text-zinc-400 text-sm mb-6">This area is for arcade owners only.</p>
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">Back to home</Link>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to admin
        </Link>
        <span className="text-zinc-700">/</span>
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">{arcade!.name}</p>
          <h1 className="font-display text-3xl text-white leading-none">REGISTRATIONS</h1>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',      value: rows.length,                                                   color: 'text-white'          },
          { label: 'Paid',       value: rows.filter((r) => r.payment_status === 'paid').length,        color: 'text-green-400'      },
          { label: 'Checked In', value: rows.filter((r) => r.registration_status === 'checked_in').length, color: 'text-blue-400'  },
          { label: 'Pending',    value: rows.filter((r) => r.payment_status === 'pending').length,     color: 'text-yellow-400'     },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <Users className="w-4 h-4 text-zinc-600 mb-2" />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search name, tag, booking ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 text-sm transition-colors"
          />
        </div>

        {/* Tournament filter */}
        <select
          value={filterTournament}
          onChange={(e) => setFilterTournament(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-300 focus:outline-none focus:border-red-500 text-sm transition-colors"
        >
          <option value="">All Tournaments</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Game filter */}
        <select
          value={filterGame}
          onChange={(e) => setFilterGame(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-300 focus:outline-none focus:border-red-500 text-sm transition-colors"
        >
          <option value="">All Games</option>
          {uniqueGames.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Payment filter */}
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-300 focus:outline-none focus:border-red-500 text-sm transition-colors"
        >
          <option value="">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterTournament(''); setFilterGame(''); setFilterPayment(''); }}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors px-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}

        {/* Export CSV */}
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 text-sm font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>

        {/* Complete Tournament — awards participation points */}
        {filterTournament && (
          <button
            onClick={() => completeTournament(filterTournament)}
            disabled={actionLoading === `complete-${filterTournament}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {actionLoading === `complete-${filterTournament}`
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FlagTriangleRight className="w-4 h-4" />}
            Complete Tournament
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-zinc-600 mb-3 px-1">
        Showing {filtered.length} of {rows.length} registrations
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <Filter className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">
            {rows.length === 0 ? 'No registrations yet.' : 'No registrations match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Player', 'Tournament', 'Characters / Team', 'Payment', 'Status', 'Placement', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((reg) => {
                  const chars = [reg.character_1, reg.character_2, reg.character_3].filter(Boolean).join(' / ');
                  const waUrl = buildWhatsApp(reg.phone, reg.gamer_tag, reg.tournament_name, reg.booking_ref);
                  const isPaid = reg.payment_status === 'paid';
                  const isCheckedIn = reg.registration_status === 'checked_in';
                  const isWinner = reg.is_winner;
                  const isRunnerUp = reg.placement === 2;

                  return (
                    <tr key={reg.id} className="hover:bg-zinc-800/40 transition-colors">

                      {/* Player */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-black">
                              {reg.gamer_tag.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-zinc-200 font-semibold leading-none">{reg.gamer_tag}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{reg.full_name}</p>
                          </div>
                          {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer"
                              className="ml-1 text-green-600 hover:text-green-400 transition-colors"
                              title="WhatsApp player"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Tournament */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border mb-1 ${GAME_COLOR[reg.game_type] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                          {reg.game_type}
                        </span>
                        <p className="text-zinc-300 text-xs leading-snug max-w-36 truncate">{reg.tournament_name}</p>
                        <p className="text-zinc-600 text-xs">{formatDate(reg.registered_at, 'short')}</p>
                      </td>

                      {/* Characters / Team */}
                      <td className="px-4 py-3">
                        {reg.team_name ? (
                          <div>
                            <p className="text-zinc-300 text-xs font-semibold">{reg.team_name}</p>
                            {reg.team_type && <p className="text-zinc-600 text-xs">{reg.team_type}</p>}
                          </div>
                        ) : chars ? (
                          <p className="text-zinc-400 text-xs">{chars}</p>
                        ) : (
                          <span className="text-zinc-700 text-xs">—</span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border capitalize ${
                          isPaid
                            ? 'text-green-400 bg-green-400/10 border-green-400/20'
                            : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                        }`}>
                          {reg.payment_status}
                        </span>
                        {reg.paid_at && (
                          <p className="text-zinc-600 text-xs mt-0.5">{formatDate(reg.paid_at, 'short')}</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                          isCheckedIn
                            ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                            : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                        }`}>
                          {isCheckedIn ? 'Checked in' : reg.registration_status}
                        </span>
                      </td>

                      {/* Placement */}
                      <td className="px-4 py-3">
                        {reg.placement ? (
                          <span className={`text-sm font-black ${
                            reg.placement === 1 ? 'text-yellow-400' : reg.placement === 2 ? 'text-zinc-300' : 'text-orange-400'
                          }`}>
                            {reg.placement === 1 ? '1st' : reg.placement === 2 ? '2nd' : '3rd'}
                          </span>
                        ) : (
                          <span className="text-zinc-700 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">

                          {/* Mark Paid */}
                          {!isPaid && (
                            <button
                              onClick={() => markPaid(reg)}
                              disabled={actionLoading === `paid-${reg.id}`}
                              title="Mark as paid"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-xs font-semibold transition-all disabled:opacity-50"
                            >
                              {actionLoading === `paid-${reg.id}`
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Banknote className="w-3 h-3" />}
                              Paid
                            </button>
                          )}

                          {/* Check In */}
                          {!isCheckedIn && (
                            <button
                              onClick={() => checkIn(reg)}
                              disabled={actionLoading === `checkin-${reg.id}`}
                              title="Mark as checked in"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 text-xs font-semibold transition-all disabled:opacity-50"
                            >
                              {actionLoading === `checkin-${reg.id}`
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <QrCode className="w-3 h-3" />}
                              Check In
                            </button>
                          )}

                          {/* Mark Winner */}
                          <button
                            onClick={() => setPlacement(reg, 1)}
                            disabled={!!actionLoading}
                            title="Mark as winner (1st)"
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${
                              isWinner
                                ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-yellow-500/40 hover:text-yellow-400'
                            }`}
                          >
                            {actionLoading === `place-${reg.id}`
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trophy className="w-3 h-3" />}
                            1st
                          </button>

                          {/* Mark Runner-Up */}
                          <button
                            onClick={() => setPlacement(reg, 2)}
                            disabled={!!actionLoading}
                            title="Mark as runner-up (2nd)"
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${
                              isRunnerUp
                                ? 'bg-zinc-400/20 border-zinc-400/30 text-zinc-300'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-400/40 hover:text-zinc-300'
                            }`}
                          >
                            <Medal className="w-3 h-3" />
                            2nd
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
