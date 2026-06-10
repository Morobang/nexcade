'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Loader2, AlertCircle, ArrowLeft, Banknote,
  TrendingUp, Users, Trophy, Gamepad2, Calendar,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Arcade = { id: string; name: string };

type TournamentStat = {
  id: string;
  name: string;
  game_type: string;
  status: string;
  start_at: string;
  max_players: number;
  entry_fee: number;
  prize_pool: number;
  registered_count: number;
  paid_count: number;
  collected: number;
  profit: number;
};

type MonthlyBar = { month: string; revenue: number };

// ── Constants ──────────────────────────────────────────────────────────────────

const GAME_COLOR: Record<string, string> = {
  FC26:    'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Tekken8: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  SF6:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  MK1:     'text-pink-400 bg-pink-400/10 border-pink-400/20',
  KOFXV:   'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
  Naruto:  'text-green-400 bg-green-400/10 border-green-400/20',
};

const STATUS_STYLE: Record<string, string> = {
  open:      'text-green-400 bg-green-400/10 border-green-400/20',
  full:      'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  live:      'text-red-400 bg-red-400/10 border-red-400/20',
  completed: 'text-zinc-400 bg-zinc-800 border-zinc-700',
  cancelled: 'text-zinc-600 bg-zinc-800 border-zinc-800',
};

function shortZAR(v: number) {
  if (v >= 1000) return `R${(v / 1000).toFixed(1)}k`;
  return `R${v}`;
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: MonthlyBar }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm shadow-xl">
      <p className="text-zinc-400 text-xs mb-1">{payload[0].payload.month}</p>
      <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminRevenuePage() {
  const router = useRouter();
  const [arcade, setArcade] = useState<Arcade | null>(null);
  const [stats, setStats] = useState<TournamentStat[]>([]);
  const [monthly, setMonthly] = useState<MonthlyBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadData = useCallback(async (arcadeId: string) => {
    const { data: tourneyData } = await supabase
      .from('tournaments')
      .select('id, name, game_type, status, start_at, max_players, entry_fee, prize_pool')
      .eq('arcade_id', arcadeId)
      .order('start_at', { ascending: false });

    if (!tourneyData || tourneyData.length === 0) { setStats([]); setMonthly([]); return; }

    const tourneyIds = tourneyData.map((t) => t.id);
    const tourneyMap = new Map(tourneyData.map((t) => [t.id, t]));

    const { data: regData } = await supabase
      .from('registrations')
      .select('tournament_id, payment_status, registered_at, paid_at')
      .in('tournament_id', tourneyIds)
      .neq('registration_status', 'cancelled');

    const allRegs = regData ?? [];

    // Per-tournament stats
    const statsMap: Record<string, { registered: number; paid: number }> = {};
    for (const r of allRegs) {
      if (!statsMap[r.tournament_id]) statsMap[r.tournament_id] = { registered: 0, paid: 0 };
      statsMap[r.tournament_id].registered += 1;
      if (r.payment_status === 'paid') statsMap[r.tournament_id].paid += 1;
    }

    const tournamentStats: TournamentStat[] = tourneyData.map((t) => {
      const s = statsMap[t.id] ?? { registered: 0, paid: 0 };
      const collected = s.paid * Number(t.entry_fee);
      return {
        id: t.id,
        name: t.name,
        game_type: t.game_type,
        status: t.status,
        start_at: t.start_at,
        max_players: t.max_players,
        entry_fee: Number(t.entry_fee),
        prize_pool: Number(t.prize_pool),
        registered_count: s.registered,
        paid_count: s.paid,
        collected,
        profit: collected - Number(t.prize_pool),
      };
    });
    setStats(tournamentStats);

    // Monthly revenue from paid registrations
    const monthlyMap: Record<string, number> = {};
    for (const r of allRegs) {
      if (r.payment_status !== 'paid') continue;
      const t = tourneyMap.get(r.tournament_id);
      if (!t) continue;
      const date = new Date(r.paid_at ?? r.registered_at);
      const key = date.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
      monthlyMap[key] = (monthlyMap[key] ?? 0) + Number(t.entry_fee);
    }
    const sorted = Object.entries(monthlyMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    setMonthly(sorted);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }

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

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalCollected  = stats.reduce((s, t) => s + t.collected, 0);
  const totalPrizePool  = stats.reduce((s, t) => s + t.prize_pool, 0);
  const netProfit       = totalCollected - totalPrizePool;
  const totalRegistered = stats.reduce((s, t) => s + t.registered_count, 0);
  const totalPaid       = stats.reduce((s, t) => s + t.paid_count, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to admin
        </Link>
        <span className="text-zinc-700">/</span>
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">{arcade!.name}</p>
          <h1 className="font-display text-3xl text-white leading-none">REVENUE</h1>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { icon: Banknote,   label: 'Total collected', value: formatCurrency(totalCollected), color: 'text-green-400'  },
          { icon: Trophy,     label: 'Total prize pool', value: formatCurrency(totalPrizePool), color: 'text-yellow-400' },
          { icon: TrendingUp, label: 'Net profit',      value: formatCurrency(Math.abs(netProfit)), color: netProfit >= 0 ? 'text-green-400' : 'text-red-400', prefix: netProfit < 0 ? '-' : '+' },
          { icon: Users,      label: 'Registered',      value: String(totalRegistered),        color: 'text-blue-400'   },
          { icon: Banknote,   label: 'Paid entries',    value: String(totalPaid),               color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color, prefix }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className={`text-xl font-bold ${color}`}>{prefix}{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue over time chart */}
      {monthly.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Revenue Over Time</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={shortZAR}
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-tournament breakdown */}
      <h2 className="font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
        <Gamepad2 className="w-4 h-4 text-red-500" />
        Per Tournament
        <span className="text-zinc-600 font-normal">({stats.length})</span>
      </h2>

      {stats.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <Banknote className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No tournaments yet — revenue will appear here once you create one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {stats.map((t) => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              {/* Top row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${GAME_COLOR[t.game_type] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                      {t.game_type}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLE[t.status] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-white font-bold text-base leading-snug">{t.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(t.start_at, 'short')} · {t.entry_fee === 0 ? 'Free entry' : `${formatCurrency(t.entry_fee)} entry`} · {t.max_players} max players
                  </p>
                </div>

                {/* Profit badge */}
                <div className={`shrink-0 text-right px-3 py-2 rounded-xl border ${
                  t.profit >= 0
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  <p className="text-xs text-current opacity-70 mb-0.5">Profit</p>
                  <p className="font-bold text-sm">{t.profit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(t.profit))}</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Registered', value: `${t.registered_count} / ${t.max_players}`, color: 'text-blue-400'   },
                  { label: 'Paid',       value: `${t.paid_count} / ${t.registered_count}`,   color: 'text-green-400' },
                  { label: 'Collected',  value: formatCurrency(t.collected),                  color: 'text-white'     },
                  { label: 'Prize pool', value: formatCurrency(t.prize_pool),                 color: 'text-yellow-400'},
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-zinc-800/50 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Fill rate bar */}
              {t.registered_count > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-zinc-600 mb-1">
                    <span>Fill rate</span>
                    <span>{Math.round((t.registered_count / t.max_players) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full transition-all"
                      style={{ width: `${Math.min((t.registered_count / t.max_players) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
