'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loader2, Banknote, TrendingUp, Building2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

type MonthlyBar = { month: string; revenue: number };
type ArcadeRevenue = { arcade: string; revenue: number; count: number };
type RecentReg = {
  id: string;
  arcade: string;
  tournament: string;
  amount: number;
  paid_at: string;
};

export default function PlatformRevenuePage() {
  const authState = usePlatformAdmin();
  const [monthlyData, setMonthlyData] = useState<MonthlyBar[]>([]);
  const [byArcade, setByArcade] = useState<ArcadeRevenue[]>([]);
  const [recent, setRecent] = useState<RecentReg[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authState !== 'ok') return;
    async function load() {
      const { data: regs } = await supabase
        .from('registrations')
        .select('id, paid_at, registered_at, tournaments!inner(name, entry_fee, arcades!inner(name))')
        .eq('payment_status', 'paid')
        .neq('registration_status', 'cancelled')
        .order('paid_at', { ascending: false });

      let total = 0;
      const monthMap: Record<string, number> = {};
      const arcadeMap: Record<string, { revenue: number; count: number }> = {};
      const recentRows: RecentReg[] = [];

      for (const r of (regs ?? [])) {
        const t = (r as any).tournaments as { name: string; entry_fee: number; arcades: { name: string } } | null;
        const fee = Number(t?.entry_fee ?? 0);
        const arcadeName = t?.arcades?.name ?? '—';
        const dateStr = r.paid_at ?? r.registered_at;
        const monthKey = dateStr
          ? new Date(dateStr).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
          : 'Unknown';

        total += fee;
        monthMap[monthKey] = (monthMap[monthKey] ?? 0) + fee;
        arcadeMap[arcadeName] = {
          revenue: (arcadeMap[arcadeName]?.revenue ?? 0) + fee,
          count: (arcadeMap[arcadeName]?.count ?? 0) + 1,
        };

        if (recentRows.length < 20) {
          recentRows.push({
            id: r.id,
            arcade: arcadeName,
            tournament: t?.name ?? '—',
            amount: fee,
            paid_at: dateStr ?? '',
          });
        }
      }

      const sortedMonths = Object.entries(monthMap)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => new Date(`01 ${a.month}`).getTime() - new Date(`01 ${b.month}`).getTime());

      const sortedArcades = Object.entries(arcadeMap)
        .map(([arcade, { revenue, count }]) => ({ arcade, revenue, count }))
        .sort((a, b) => b.revenue - a.revenue);

      setTotalRevenue(total);
      setMonthlyData(sortedMonths);
      setByArcade(sortedArcades);
      setRecent(recentRows);
      setLoading(false);
    }
    load();
  }, [authState]);

  if (authState === 'loading' || (authState === 'ok' && loading)) {
    return (
      <PlatformShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-fg-3 animate-spin" />
        </div>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8">
          <h1 className="font-display text-3xl text-fg mb-1">REVENUE</h1>
          <p className="text-fg-3 text-sm">Platform-wide earnings from paid registrations.</p>
        </div>

        {/* Total */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface border border-stroke rounded-xl p-5">
            <Banknote className="w-5 h-5 text-red-400 mb-2" />
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-fg-3 mt-0.5">Total platform revenue</p>
          </div>
          <div className="bg-surface border border-stroke rounded-xl p-5">
            <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-green-400">
              {monthlyData.length > 0 ? formatCurrency(monthlyData[monthlyData.length - 1].revenue) : '—'}
            </p>
            <p className="text-xs text-fg-3 mt-0.5">This month</p>
          </div>
          <div className="bg-surface border border-stroke rounded-xl p-5">
            <Building2 className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-blue-400">{byArcade.length}</p>
            <p className="text-xs text-fg-3 mt-0.5">Contributing arcades</p>
          </div>
        </div>

        {/* Monthly chart */}
        {monthlyData.length > 0 && (
          <div className="bg-surface border border-stroke rounded-2xl p-5 mb-6">
            <h2 className="text-fg font-bold text-sm mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-stroke, #27272a)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--color-fg-3, #71717a)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: 'var(--color-fg-3, #71717a)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface, #18181b)',
                    border: '1px solid var(--color-stroke, #27272a)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Revenue']}
                  labelStyle={{ color: 'var(--color-fg-2, #a1a1aa)', marginBottom: 4 }}
                />
                <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By arcade */}
          <div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke">
              <h2 className="text-fg font-bold text-sm">Revenue by Arcade</h2>
            </div>
            <div className="divide-y divide-stroke">
              {byArcade.slice(0, 10).map(({ arcade, revenue, count }) => (
                <div key={arcade} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-fg text-sm font-semibold truncate">{arcade}</p>
                    <p className="text-fg-3 text-xs">{count} paid registration{count !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-red-400 font-bold text-sm shrink-0">{formatCurrency(revenue)}</p>
                </div>
              ))}
              {byArcade.length === 0 && (
                <div className="px-5 py-8 text-center text-fg-3 text-sm">No revenue yet.</div>
              )}
            </div>
          </div>

          {/* Recent registrations */}
          <div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke">
              <h2 className="text-fg font-bold text-sm">Recent Paid Registrations</h2>
            </div>
            <div className="divide-y divide-stroke">
              {recent.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-fg text-xs font-semibold truncate">{r.tournament}</p>
                    <p className="text-fg-3 text-xs">{r.arcade} · {r.paid_at ? formatDate(r.paid_at, 'short') : '—'}</p>
                  </div>
                  <p className="text-green-400 font-bold text-sm shrink-0">{formatCurrency(r.amount)}</p>
                </div>
              ))}
              {recent.length === 0 && (
                <div className="px-5 py-8 text-center text-fg-3 text-sm">No paid registrations yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </PlatformShell>
  );
}
