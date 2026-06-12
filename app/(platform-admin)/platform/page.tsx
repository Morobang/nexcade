'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Loader2, AlertCircle, Building2, Users, Trophy,
  Banknote, ShieldCheck, ShieldOff,
  CheckCircle2, XCircle, Gamepad2, Crown,
  LayoutDashboard, ChevronRight, ClipboardList, Clock,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ArcadeRow = {
  id: string;
  name: string;
  city: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  owner_full_name: string | null;
  owner_email: string | null;
  tournament_count: number;
};

type UserRow = {
  id: string;
  full_name: string;
  gamer_tag: string;
  email: string;
  role: string;
  created_at: string;
};

type TournamentRow = {
  id: string;
  name: string;
  game_type: string;
  status: string;
  start_at: string;
  max_players: number;
  entry_fee: number;
  arcade_name: string;
  reg_count: number;
};

type PlatformStats = {
  totalArcades: number;
  activeArcades: number;
  pendingArcades: number;
  totalUsers: number;
  totalTournaments: number;
  totalRevenue: number;
};

type ApplicationRow = {
  id: string;
  profile_id: string;
  arcade_name: string;
  city: string;
  address: string | null;
  contact_email: string;
  whatsapp_number: string | null;
  games_supported: string[];
  description: string | null;
  console_setup: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  applicant_name: string | null;
  applicant_email: string | null;
};

type Tab = 'overview' | 'applications' | 'arcades' | 'users' | 'tournaments';

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

const ROLE_STYLE: Record<string, string> = {
  player:         'text-zinc-400 bg-zinc-800 border-zinc-700',
  arcade_owner:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
  platform_admin: 'text-red-400 bg-red-400/10 border-red-400/20',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlatformAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [arcades, setArcades] = useState<ArcadeRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadAll = useCallback(async () => {
    // Arcades with owner profile
    const { data: arcadeData } = await supabase
      .from('arcades')
      .select('id, name, city, slug, is_active, created_at, owner_id, profiles!owner_id(full_name, email)')
      .order('created_at', { ascending: false });

    // Tournaments
    const { data: tourneyData } = await supabase
      .from('tournaments')
      .select('id, name, game_type, status, start_at, max_players, entry_fee, arcade_id, arcades(name)')
      .order('start_at', { ascending: false })
      .limit(100);

    // Users
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, full_name, gamer_tag, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    // Registration counts for revenue + counts
    const tourneyIds = (tourneyData ?? []).map((t) => t.id);
    const { data: regData } = tourneyIds.length > 0
      ? await supabase
          .from('registrations')
          .select('tournament_id, payment_status')
          .in('tournament_id', tourneyIds)
          .neq('registration_status', 'cancelled')
      : { data: [] };

    const regCountMap: Record<string, number> = {};
    let totalRevenue = 0;
    for (const r of (regData ?? [])) {
      regCountMap[r.tournament_id] = (regCountMap[r.tournament_id] ?? 0) + 1;
    }
    for (const t of (tourneyData ?? [])) {
      const paid = (regData ?? []).filter((r) => r.tournament_id === t.id && r.payment_status === 'paid').length;
      totalRevenue += paid * Number(t.entry_fee);
    }

    // Tournament counts per arcade
    const arcadeTourneyCount: Record<string, number> = {};
    for (const t of (tourneyData ?? [])) {
      arcadeTourneyCount[t.arcade_id] = (arcadeTourneyCount[t.arcade_id] ?? 0) + 1;
    }

    const arcadeRows: ArcadeRow[] = (arcadeData ?? []).map((a) => {
      const owner = (a as any).profiles as { full_name: string; email: string } | null;
      return {
        id: a.id,
        name: a.name,
        city: a.city,
        slug: a.slug,
        is_active: a.is_active,
        created_at: a.created_at,
        owner_full_name: owner?.full_name ?? null,
        owner_email: owner?.email ?? null,
        tournament_count: arcadeTourneyCount[a.id] ?? 0,
      };
    });

    const tourneyRows: TournamentRow[] = (tourneyData ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      game_type: t.game_type,
      status: t.status,
      start_at: t.start_at,
      max_players: t.max_players,
      entry_fee: Number(t.entry_fee),
      arcade_name: ((t as any).arcades as { name: string } | null)?.name ?? '—',
      reg_count: regCountMap[t.id] ?? 0,
    }));

    // Applications
    const { data: appData } = await supabase
      .from('arcade_applications')
      .select('id, profile_id, arcade_name, city, address, contact_email, whatsapp_number, games_supported, description, console_setup, status, rejection_reason, created_at, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    const appRows: ApplicationRow[] = (appData ?? []).map((a) => {
      const applicant = (a as any).profiles as { full_name: string; email: string } | null;
      return {
        id: a.id,
        profile_id: a.profile_id,
        arcade_name: a.arcade_name,
        city: a.city,
        address: a.address,
        contact_email: a.contact_email,
        whatsapp_number: a.whatsapp_number,
        games_supported: a.games_supported ?? [],
        description: a.description,
        console_setup: a.console_setup,
        status: a.status,
        rejection_reason: a.rejection_reason,
        created_at: a.created_at,
        applicant_name: applicant?.full_name ?? null,
        applicant_email: applicant?.email ?? null,
      };
    });

    setApplications(appRows);
    setArcades(arcadeRows);
    setTournaments(tourneyRows);
    setUsers((userData ?? []) as UserRow[]);
    setStats({
      totalArcades: arcadeRows.length,
      activeArcades: arcadeRows.filter((a) => a.is_active).length,
      pendingArcades: arcadeRows.filter((a) => !a.is_active).length,
      totalUsers: (userData ?? []).length,
      totalTournaments: tourneyRows.length,
      totalRevenue,
    });
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (profile?.role !== 'platform_admin') {
        setUnauthorized(true); setLoading(false); return;
      }

      await loadAll();
      setLoading(false);
    }
    init();
  }, [router, loadAll]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function approveApplication(appId: string) {
    setActionLoading(`app-${appId}`);
    const { error } = await supabase.rpc('approve_arcade_application', { p_application_id: appId });
    if (!error) {
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: 'approved' } : a));
      await loadAll();
    }
    setActionLoading(null);
  }

  async function rejectApplication(appId: string, reason: string) {
    setActionLoading(`app-${appId}`);
    await supabase.rpc('reject_arcade_application', { p_application_id: appId, p_reason: reason || null });
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: 'rejected', rejection_reason: reason || null } : a));
    setRejectModal(null);
    setRejectReason('');
    setActionLoading(null);
  }

  async function setArcadeActive(arcadeId: string, active: boolean) {
    setActionLoading(`arcade-${arcadeId}`);
    await supabase.from('arcades').update({ is_active: active }).eq('id', arcadeId);
    setArcades((prev) => prev.map((a) => a.id === arcadeId ? { ...a, is_active: active } : a));
    setStats((prev) => prev ? {
      ...prev,
      activeArcades: prev.activeArcades + (active ? 1 : -1),
      pendingArcades: prev.pendingArcades + (active ? -1 : 1),
    } : prev);
    setActionLoading(null);
  }

  async function setUserRole(userId: string, role: string) {
    setActionLoading(`user-${userId}`);
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    setActionLoading(null);
  }

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
          <p className="text-zinc-400 text-sm mb-6">Platform admin only.</p>
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">Back to home</Link>
        </div>
      </div>
    );
  }

  const pendingApps = applications.filter((a) => a.status === 'pending');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',     label: 'Overview',    icon: LayoutDashboard },
    { id: 'applications', label: `Applications${pendingApps.length > 0 ? ` (${pendingApps.length})` : ''}`, icon: ClipboardList },
    { id: 'arcades',      label: `Arcades (${arcades.length})`,        icon: Building2  },
    { id: 'users',        label: `Users (${users.length})`,            icon: Users      },
    { id: 'tournaments',  label: `Tournaments (${tournaments.length})`, icon: Trophy    },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Crown className="w-6 h-6 text-red-500" />
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Super Admin</p>
          <h1 className="font-display text-4xl text-white leading-none">NEXCADE PLATFORM</h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              tab === id
                ? 'bg-red-600 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && stats && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Building2,  label: 'Total arcades',  value: stats.totalArcades,              color: 'text-white'        },
              { icon: CheckCircle2, label: 'Active',        value: stats.activeArcades,             color: 'text-green-400'    },
              { icon: XCircle,    label: 'Pending / off',  value: stats.pendingArcades,            color: 'text-yellow-400'   },
              { icon: Users,      label: 'Users',          value: stats.totalUsers,                color: 'text-blue-400'     },
              { icon: Trophy,     label: 'Tournaments',    value: stats.totalTournaments,          color: 'text-purple-400'   },
              { icon: Banknote,   label: 'Platform revenue', value: formatCurrency(stats.totalRevenue), color: 'text-red-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <Icon className={`w-4 h-4 ${color} mb-2`} />
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{label}</p>
              </div>
            ))}
          </div>

          {/* Quick navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { tab: 'arcades' as Tab,     icon: Building2, label: 'Manage Arcades',     desc: 'Approve, suspend, review'   },
              { tab: 'users' as Tab,       icon: Users,     label: 'Manage Users',        desc: 'Roles and accounts'         },
              { tab: 'tournaments' as Tab, icon: Trophy,    label: 'All Tournaments',     desc: 'Platform-wide view'         },
            ].map(({ tab: t, icon: Icon, label, desc }) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 hover:border-zinc-600 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-red-600/20 transition-colors">
                  <Icon className="w-5 h-5 text-zinc-400 group-hover:text-red-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm group-hover:text-red-400 transition-colors">{label}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── APPLICATIONS TAB ── */}
      {tab === 'applications' && (
        <div className="flex flex-col gap-4">
          {applications.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <ClipboardList className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No applications yet.</p>
            </div>
          )}
          {applications.map((a) => (
            <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      a.status === 'pending'  ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                      a.status === 'approved' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                                                'text-red-400 bg-red-400/10 border-red-400/20'
                    }`}>
                      {a.status === 'pending' && <Clock className="w-3 h-3" />}
                      {a.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                      {a.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </span>
                    <span className="text-zinc-600 text-xs">{formatDate(a.created_at, 'short')}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{a.arcade_name}</h3>
                  <p className="text-zinc-400 text-sm">{a.city}{a.address ? ` · ${a.address}` : ''}</p>
                </div>

                {a.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => approveApplication(a.id)}
                      disabled={actionLoading === `app-${a.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {actionLoading === `app-${a.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                    <button
                      onClick={() => { setRejectModal({ id: a.id, name: a.arcade_name }); setRejectReason(''); }}
                      disabled={actionLoading === `app-${a.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-500 mb-0.5">Applicant</p>
                  <p className="text-zinc-200 font-semibold truncate">{a.applicant_name ?? '—'}</p>
                  <p className="text-zinc-500 truncate">{a.applicant_email ?? '—'}</p>
                </div>
                <div className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-500 mb-0.5">Contact</p>
                  <p className="text-zinc-200 truncate">{a.contact_email}</p>
                  {a.whatsapp_number && <p className="text-zinc-500">{a.whatsapp_number}</p>}
                </div>
                <div className="bg-zinc-800/60 rounded-xl p-3 col-span-2">
                  <p className="text-zinc-500 mb-1">Games</p>
                  <div className="flex flex-wrap gap-1">
                    {a.games_supported.map((g) => (
                      <span key={g} className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">{g}</span>
                    ))}
                  </div>
                </div>
              </div>

              {(a.description || a.console_setup) && (
                <div className="text-xs text-zinc-500 border-t border-zinc-800 pt-3 flex flex-col gap-1">
                  {a.description && <p><span className="text-zinc-400 font-semibold">About: </span>{a.description}</p>}
                  {a.console_setup && <p><span className="text-zinc-400 font-semibold">Setup: </span>{a.console_setup}</p>}
                </div>
              )}

              {a.status === 'rejected' && a.rejection_reason && (
                <div className="text-xs text-red-400 border-t border-zinc-800 pt-3">
                  <span className="font-semibold">Rejection reason: </span>{a.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ARCADES TAB ── */}
      {tab === 'arcades' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Arcade', 'Owner', 'City', 'Tournaments', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {arcades.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-semibold text-sm">{a.name}</p>
                      <Link href={`/arcades/${a.slug}`} target="_blank"
                        className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
                        /arcades/{a.slug}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-300 text-xs">{a.owner_full_name ?? '—'}</p>
                      <p className="text-zinc-600 text-xs">{a.owner_email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{a.city}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{a.tournament_count}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        a.is_active
                          ? 'text-green-400 bg-green-400/10 border-green-400/20'
                          : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                      }`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-xs">{formatDate(a.created_at, 'short')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {a.is_active ? (
                          <button
                            onClick={() => setArcadeActive(a.id, false)}
                            disabled={actionLoading === `arcade-${a.id}`}
                            title="Suspend arcade"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 text-yellow-400 text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {actionLoading === `arcade-${a.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setArcadeActive(a.id, true)}
                            disabled={actionLoading === `arcade-${a.id}`}
                            title="Approve / activate arcade"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {actionLoading === `arcade-${a.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {arcades.length === 0 && (
              <div className="p-10 text-center text-zinc-500 text-sm">No arcades registered yet.</div>
            )}
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Player', 'Email', 'Role', 'Joined', 'Change Role'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-semibold text-sm">{u.gamer_tag}</p>
                      <p className="text-zinc-500 text-xs">{u.full_name}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${ROLE_STYLE[u.role] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        {u.role === 'platform_admin' ? 'Platform Admin' : u.role === 'arcade_owner' ? 'Arcade Owner' : 'Player'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-xs">{formatDate(u.created_at, 'short')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(['player', 'arcade_owner'] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => setUserRole(u.id, role)}
                            disabled={u.role === role || actionLoading === `user-${u.id}`}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.role === role
                                ? 'bg-zinc-700 border-zinc-600 text-zinc-300'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {actionLoading === `user-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null}
                            {role === 'player' ? 'Player' : 'Arcade Owner'}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-10 text-center text-zinc-500 text-sm">No users found.</div>
            )}
          </div>
        </div>
      )}

      {/* ── TOURNAMENTS TAB ── */}
      {tab === 'tournaments' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Tournament', 'Arcade', 'Game', 'Status', 'Date', 'Players', 'Entry'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-semibold text-sm truncate max-w-48">{t.name}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{t.arcade_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${GAME_COLOR[t.game_type] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        {t.game_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLE[t.status] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{formatDate(t.start_at, 'short')}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{t.reg_count}/{t.max_players}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{t.entry_fee === 0 ? 'Free' : formatCurrency(t.entry_fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tournaments.length === 0 && (
              <div className="p-10 text-center text-zinc-500 text-sm flex flex-col items-center gap-2">
                <Gamepad2 className="w-8 h-8 text-zinc-700" />
                No tournaments yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-white text-lg mb-1">Reject application</h3>
            <p className="text-zinc-400 text-sm mb-5">
              Rejecting <span className="text-white font-semibold">{rejectModal.name}</span>. Optionally add a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason (optional — the applicant will see this)"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => rejectApplication(rejectModal.id, rejectReason)}
                disabled={actionLoading === `app-${rejectModal.id}`}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === `app-${rejectModal.id}` && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm reject
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
