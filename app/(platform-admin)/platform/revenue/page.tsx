'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, AlertCircle, Banknote, Users, Trophy, TrendingUp } from 'lucide-react';

type TournamentStat = {
  id: string;
  name: string;
  game_type: string;
  arcade_name: string;
  entry_fee: number;
  paid_count: number;
  revenue: number;
  start_at: string;
};

type MonthBar = { month: string; revenue: number };
type ArcadeStat = { arcade_name: string; revenue: number; tournament_count: number };

function shortZAR(v: number) {
  if (v >= 1000) return `R${(v / 1000).toFixed(1)}k`;
  return `R${v}`;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: MonthBar }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm shadow-xl">
      <p className="text-zinc-400 text-xs mb-1">{payload[0].payload.month}</p>
      <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function PlatformRevenuePage() {
  const auth = usePlatformAdmin();
  const [tournamentStats, setTournamentStats] = useState<TournamentStat[]>([]);
  const [monthStats, setMonthStats] = useState<MonthBar[]>([]);
  const [arcadeStats, setArcadeStats] = useState<ArcadeStat[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth !== 'ok') return;
    load();
  }, [auth]);

  async function load() {
    // Load ALL paid registrations with tournament + arcade info — no limit
    const { data: regData } = await supabase
      .from('registrations')
      .select('payment_status, paid_at, registered_at, tournament_id, tournaments!inner(id, name, game_type, entry_fee, start_at, arcades!inner(name))')
      .eq('payment_status', 'paid')
      .neq('registration_status', 'cancelled');

    const regs = regData ?? [];

    const tourneyMap: Record<string, TournamentStat> = {};
    const monthMap: Record<string, number> = {};
    const arcadeRevMap: Record<string, number> = {};
    const arcadeTourneyIds: Record<string, Set<string>> = {};

    let total = 0;

    for (const r of regs) {
      const t = (r as any).tournaments as {
        id: string;
        name: string;
        game_type: string;
        entry_fee: number;
        start_at: string;
        arcades: { name: string };
      } | null;
      if (!t) continue;

      const fee = Number(t.entry_fee);
      total += fee;

      // Per-tournament aggregation
      if (!tourneyMap[t.id]) {
        tourneyMap[t.id] = {
          id: t.id,
          name: t.name,
          game_type: t.game_type,
          arcade_name: t.arcades?.name ?? '—',
          entry_fee: fee,
          paid_count: 0,
          revenue: 0,
          start_at: t.start_at,
        };
      }
      tourneyMap[t.id].paid_count += 1;
      tourneyMap[t.id].revenue += fee;

      // Monthly aggregation (use paid_at or registered_at)
      const dateStr = (r as any).paid_at ?? (r as any).registered_at ?? t.start_at;
      const monthKey = new Date(dateStr).toLocaleDateString('en-ZA', {
        month: 'short',
        year: 'numeric',
      });
      monthMap[monthKey] = (monthMap[monthKey] ?? 0) + fee;

      // Per-arcade aggregation
      const arcadeName = t.arcades?.name ?? '—';
      arcadeRevMap[arcadeName] = (arcadeRevMap[arcadeName] ?? 0) + fee;
      if (!arcadeTourneyIds[arcadeName]) arcadeTourneyIds[arcadeName] = new Set();
      arcadeTourneyIds[arcadeName].add(t.id);
    }

    const tournamentStatsList = Object.values(tourneyMap).sort((a, b) => b.revenue - a.revenue);

    const monthStatsList: MonthBar[] = Object.entries(monthMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const arcadeStatsList: ArcadeStat[] = Object.entries(arcadeRevMap)
      .map(([arcade_name, revenue]) => ({
        arcade_name,
        revenue,
        tournament_count: arcadeTourneyIds[arcade_name]?.size ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    setTournamentStats(tournamentStatsList);
    setMonthStats(monthStatsList);
    setArcadeStats(arcadeStatsList);
    setTotalRevenue(total);
    setTotalPaid(regs.length);
    setLoading(false);
  }

  if (auth === 'loading' || (auth === 'ok' && loading)) {
    return (
      <PlatformShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        </div>
      </PlatformShell>
    );
  }

  if (auth === 'denied') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
    );
  }

  const avgPerTournament = tournamentStats.length > 0
    ? totalRevenue / tournamentStats.length
    : 0;

  return (
    <PlatformShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-white">REVENUE</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Platform-wide earnings from all paid registrations</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Banknote,   label: 'Total revenue',              value: formatCurrency(totalRevenue),       color: 'text-green-400'  },
            { icon: Users,      label: 'Paid registrations',         value: String(totalPaid),                  color: 'text-blue-400'   },
            { icon: Trophy,     label: 'Revenue-generating events',  value: String(tournamentStats.length),     color: 'text-purple-400' },
            { icon: TrendingUp, label: 'Avg per tournament',         value: formatCurrency(avgPerTournament),   color: 'text-yellow-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <Icon className={`w-4 h-4 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{label}</p>
            </div>
          ))}
        </div>

        {/* Monthly chart */}
        {monthStats.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <h2 className="font-bold text-white text-sm uppercase tracking-wider">Revenue Over Time</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthStats} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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

        {/* Revenue breakdown + top tournaments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By arcade */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-bold text-white text-sm uppercase tracking-wider">By Arcade</h2>
            </div>
            {arcadeStats.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No revenue data yet.</p>
            ) : (
              arcadeStats.map((a) => (
                <div
                  key={a.arcade_name}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/50 last:border-0"
                >
                  <div>
                    <p className="text-zinc-200 font-semibold text-sm">{a.arcade_name}</p>
                    <p className="text-zinc-500 text-xs">
                      {a.tournament_count} tournament{a.tournament_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-green-400 font-bold text-sm">{formatCurrency(a.revenue)}</p>
                </div>
              ))
            )}
          </div>

          {/* Top tournaments */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-bold text-white text-sm uppercase tracking-wider">Top Tournaments</h2>
            </div>
            {tournamentStats.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No revenue data yet.</p>
            ) : (
              tournamentStats.slice(0, 10).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/50 last:border-0"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-zinc-200 font-semibold text-sm truncate">{t.name}</p>
                    <p className="text-zinc-500 text-xs">{t.arcade_name} · {t.paid_count} paid</p>
                  </div>
                  <p className="text-green-400 font-bold text-sm shrink-0">{formatCurrency(t.revenue)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
