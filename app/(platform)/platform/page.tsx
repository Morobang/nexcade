'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatCurrency } from '@/lib/utils';
import {
  Building2, Users, Trophy, Banknote, CheckCircle2, ClipboardList,
  ChevronRight, Loader2, Crown,
} from 'lucide-react';

type Stats = {
  totalArcades: number;
  activeArcades: number;
  pendingApplications: number;
  totalUsers: number;
  totalTournaments: number;
  totalRevenue: number;
};

const QUICK_LINKS = [
  { href: '/platform/applications', icon: ClipboardList, label: 'Applications',  desc: 'Review arcade applications'     },
  { href: '/platform/arcades',      icon: Building2,     label: 'Arcades',        desc: 'Manage all arcades'             },
  { href: '/platform/users',        icon: Users,         label: 'Users',          desc: 'Manage roles and accounts'      },
  { href: '/platform/revenue',      icon: Banknote,      label: 'Revenue',        desc: 'Platform-wide earnings'         },
  { href: '/platform/tournaments',  icon: Trophy,        label: 'Tournaments',    desc: 'All tournaments platform-wide'  },
];

export default function PlatformOverviewPage() {
  const authState = usePlatformAdmin();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (authState !== 'ok') return;
    async function load() {
      const [arcadesRes, appsRes, usersRes, tourneysRes, regsRes] = await Promise.all([
        supabase.from('arcades').select('id, is_active'),
        supabase.from('arcade_applications').select('id').eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tournaments').select('id', { count: 'exact', head: true }),
        supabase
          .from('registrations')
          .select('tournaments!inner(entry_fee)')
          .eq('payment_status', 'paid')
          .neq('registration_status', 'cancelled'),
      ]);

      let totalRevenue = 0;
      for (const r of (regsRes.data ?? [])) {
        totalRevenue += Number((r as any).tournaments?.entry_fee ?? 0);
      }

      setStats({
        totalArcades: arcadesRes.data?.length ?? 0,
        activeArcades: arcadesRes.data?.filter((a) => a.is_active).length ?? 0,
        pendingApplications: appsRes.data?.length ?? 0,
        totalUsers: usersRes.count ?? 0,
        totalTournaments: tourneysRes.count ?? 0,
        totalRevenue,
      });
    }
    load();
  }, [authState]);

  if (authState === 'loading' || (authState === 'ok' && !stats)) {
    return (
      <PlatformShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-fg-3 animate-spin" />
        </div>
      </PlatformShell>
    );
  }

  if (authState === 'denied') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <p className="text-fg-3 text-sm">Access denied — platform admin only.</p>
      </div>
    );
  }

  return (
    <PlatformShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center gap-3 mb-8">
          <Crown className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-fg-3 text-xs uppercase tracking-widest">Super Admin</p>
            <h1 className="font-display text-4xl text-fg leading-none">NEXCADE PLATFORM</h1>
          </div>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Building2,    label: 'Total arcades',         value: stats.totalArcades,                   color: 'text-fg'          },
                { icon: CheckCircle2, label: 'Active arcades',        value: stats.activeArcades,                  color: 'text-green-400'   },
                { icon: ClipboardList, label: 'Pending applications', value: stats.pendingApplications,            color: 'text-yellow-400'  },
                { icon: Users,        label: 'Registered users',      value: stats.totalUsers,                     color: 'text-blue-400'    },
                { icon: Trophy,       label: 'Tournaments',           value: stats.totalTournaments,               color: 'text-purple-400'  },
                { icon: Banknote,     label: 'Platform revenue',      value: formatCurrency(stats.totalRevenue),   color: 'text-red-400'     },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-surface border border-stroke rounded-xl p-4">
                  <Icon className={`w-4 h-4 ${color} mb-2`} />
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-fg-3 mt-0.5 leading-snug">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="group bg-surface border border-stroke rounded-xl p-5 flex items-center gap-4 hover:border-zinc-500 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center shrink-0 group-hover:bg-red-600/20 transition-colors">
                    <Icon className="w-5 h-5 text-fg-3 group-hover:text-red-400 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="text-fg font-semibold text-sm group-hover:text-red-400 transition-colors">{label}</p>
                    <p className="text-fg-3 text-xs mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-fg-3 group-hover:text-fg-2 transition-colors" />
                </Link>
              ))}
            </div>
          </>
        )}

      </div>
    </PlatformShell>
  );
}
