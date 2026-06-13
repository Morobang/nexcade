'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatCurrency } from '@/lib/utils';
import {
  Loader2, AlertCircle, Building2, Users, Trophy,
  Banknote, ClipboardList, CheckCircle2, Clock,
  ChevronRight, Crown,
} from 'lucide-react';

type Stats = {
  totalArcades: number;
  activeArcades: number;
  pendingApplications: number;
  totalUsers: number;
  totalTournaments: number;
  platformRevenue: number;
};

const QUICK_LINKS = [
  { href: '/platform/applications', icon: ClipboardList, label: 'Applications',  desc: 'Review arcade registration requests' },
  { href: '/platform/arcades',      icon: Building2,     label: 'Arcades',        desc: 'Manage all arcades on the platform'  },
  { href: '/platform/users',        icon: Users,         label: 'Users',          desc: 'Roles, accounts, and access'         },
  { href: '/platform/revenue',      icon: Banknote,      label: 'Revenue',        desc: 'Platform-wide earnings and charts'   },
  { href: '/platform/tournaments',  icon: Trophy,        label: 'Tournaments',    desc: 'All events across all arcades'       },
];

export default function PlatformOverviewPage() {
  const auth = usePlatformAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth !== 'ok') return;
    load();
  }, [auth]);

  async function load() {
    const [
      { count: totalArcades },
      { count: activeArcades },
      { count: totalUsers },
      { count: totalTournaments },
      { count: pendingApplications },
      { data: regData },
    ] = await Promise.all([
      supabase.from('arcades').select('*', { count: 'exact', head: true }),
      supabase.from('arcades').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('arcade_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('registrations')
        .select('payment_status, tournaments!inner(entry_fee)')
        .eq('payment_status', 'paid')
        .neq('registration_status', 'cancelled'),
    ]);

    const platformRevenue = (regData ?? []).reduce(
      (sum, r) => sum + Number((r as any).tournaments?.entry_fee ?? 0),
      0,
    );

    setStats({
      totalArcades:        totalArcades        ?? 0,
      activeArcades:       activeArcades       ?? 0,
      pendingApplications: pendingApplications ?? 0,
      totalUsers:          totalUsers          ?? 0,
      totalTournaments:    totalTournaments    ?? 0,
      platformRevenue,
    });
    setLoading(false);
  }

  if (auth === 'loading' || (auth === 'ok' && loading)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (auth === 'denied') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-white mb-2">ACCESS DENIED</h1>
          <p className="text-zinc-400 text-sm mb-6">Platform admin only.</p>
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const s = stats!;

  const STAT_CARDS = [
    { icon: Building2,    label: 'Total arcades',        value: s.totalArcades,                    color: 'text-white'        },
    { icon: CheckCircle2, label: 'Active arcades',        value: s.activeArcades,                   color: 'text-green-400'    },
    { icon: Clock,        label: 'Pending applications', value: s.pendingApplications,             color: 'text-yellow-400'   },
    { icon: Users,        label: 'Registered users',     value: s.totalUsers,                      color: 'text-blue-400'     },
    { icon: Trophy,       label: 'Total tournaments',    value: s.totalTournaments,                color: 'text-purple-400'   },
    { icon: Banknote,     label: 'Platform revenue',     value: formatCurrency(s.platformRevenue), color: 'text-red-400'      },
  ];

  return (
    <PlatformShell pendingCount={s.pendingApplications}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest">Super Admin</p>
            <h1 className="font-display text-4xl text-white leading-none">PLATFORM OVERVIEW</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {STAT_CARDS.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <Icon className={`w-4 h-4 ${color} mb-2`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 hover:border-zinc-600 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-red-600/20 transition-colors">
                <Icon className="w-5 h-5 text-zinc-400 group-hover:text-red-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm group-hover:text-red-400 transition-colors">{label}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </PlatformShell>
  );
}
