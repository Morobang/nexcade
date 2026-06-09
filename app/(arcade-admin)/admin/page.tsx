'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import {
  Loader2, Users, Banknote, Gamepad2, CheckCircle2,
  Trophy, LayoutDashboard, PlusCircle, ListOrdered,
  Tv, Settings, TrendingUp, ChevronRight, AlertCircle,
} from 'lucide-react';

type Arcade = { id: string; name: string; city: string };

type Stats = {
  totalRegistrations: number;
  revenueCollected: number;
  activeTournaments: number;
  paidPlayers: number;
  winnersRecorded: number;
};

const QUICK_LINKS = [
  { href: '/admin/tournaments',        icon: PlusCircle,    label: 'Tournaments',        desc: 'Create and manage events'     },
  { href: '/admin/registrations',     icon: ListOrdered,   label: 'Registrations',      desc: 'Manage player sign-ups'       },
  { href: '/admin/revenue',           icon: TrendingUp,    label: 'Revenue',             desc: 'Track payments and earnings'  },
  { href: '/admin/stream',            icon: Tv,            label: 'Stream Controls',     desc: 'Go live and manage streams'   },
  { href: '/admin/grand-final',         icon: Trophy,        label: 'Grand Final',         desc: 'Qualifier results & GF setup' },
  { href: '/admin/settings',           icon: Settings,      label: 'Arcade Profile',      desc: 'Edit your arcade details'     },
];

export default function AdminOverviewPage() {
  const router = useRouter();
  const [arcade, setArcade] = useState<Arcade | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      // Check role and get arcade
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['arcade_owner', 'platform_admin'].includes(profile.role)) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const { data: arcadeData } = await supabase
        .from('arcades')
        .select('id, name, city')
        .eq('owner_id', user.id)
        .single();

      if (!arcadeData) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setArcade(arcadeData);

      // Fetch all tournaments for this arcade
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, status')
        .eq('arcade_id', arcadeData.id);

      const tournamentIds = (tournaments ?? []).map((t) => t.id);
      const activeTournaments = (tournaments ?? []).filter(
        (t) => ['open', 'full', 'live'].includes(t.status)
      ).length;

      if (tournamentIds.length === 0) {
        setStats({ totalRegistrations: 0, revenueCollected: 0, activeTournaments, paidPlayers: 0, winnersRecorded: 0 });
        setLoading(false);
        return;
      }

      // Fetch registrations + results in parallel
      const [{ data: regData }, { data: resultData }] = await Promise.all([
        supabase
          .from('registrations')
          .select('id, payment_status, tournament_id, tournaments!inner(entry_fee)')
          .in('tournament_id', tournamentIds)
          .neq('registration_status', 'cancelled'),
        supabase
          .from('results')
          .select('id, is_winner')
          .in('tournament_id', tournamentIds),
      ]);

      const registrations = regData ?? [];
      const results = resultData ?? [];

      const paidRegs = registrations.filter((r) => r.payment_status === 'paid');
      const revenueCollected = paidRegs.reduce((sum, r) => {
        const fee = (r as any).tournaments?.entry_fee ?? 0;
        return sum + fee;
      }, 0);

      setStats({
        totalRegistrations: registrations.length,
        revenueCollected,
        activeTournaments,
        paidPlayers: paidRegs.length,
        winnersRecorded: results.filter((r) => r.is_winner).length,
      });

      setLoading(false);
    }
    load();
  }, [router]);

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
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const STAT_CARDS = [
    { icon: Users,       label: 'Total registrations', value: stats!.totalRegistrations, color: 'text-blue-400'   },
    { icon: Banknote,    label: 'Revenue collected',   value: formatCurrency(stats!.revenueCollected), color: 'text-green-400' },
    { icon: Gamepad2,    label: 'Active tournaments',  value: stats!.activeTournaments,  color: 'text-red-400'    },
    { icon: CheckCircle2,label: 'Paid players',        value: stats!.paidPlayers,        color: 'text-yellow-400' },
    { icon: Trophy,      label: 'Winners recorded',    value: stats!.winnersRecorded,    color: 'text-purple-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="w-6 h-6 text-red-500" />
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Arcade Admin</p>
          <h1 className="font-display text-4xl text-white leading-none">{arcade!.name.toUpperCase()}</h1>
          <p className="text-zinc-500 text-sm">{arcade!.city}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {STAT_CARDS.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <p className="text-xl font-bold text-white leading-none">{value}</p>
            <p className="text-xs text-zinc-500 mt-1 leading-snug">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Admin Sections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
}
