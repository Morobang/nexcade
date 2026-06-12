'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PlusCircle, Building2, UserPlus, Trophy, Tv, BarChart2 } from 'lucide-react';

type Role = 'guest' | 'player' | 'arcade_owner' | 'platform_admin';

function useRole(): Role | null {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    async function resolve(userId: string | undefined) {
      if (!userId) { setRole('guest'); return; }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      setRole((data?.role as Role) ?? 'player');
    }

    supabase.auth.getSession().then(({ data: { session } }) => resolve(session?.user.id));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      resolve(session?.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  return role;
}

// ── Arcades page header button ─────────────────────────────────────────────
export function ArcadeApplyButton() {
  const role = useRole();
  if (role === null) return null;

  if (role === 'arcade_owner') {
    return (
      <Link
        href="/admin"
        className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 text-sm font-bold rounded-xl transition-colors shrink-0"
      >
        <Building2 className="w-4 h-4" />
        Manage your arcade
      </Link>
    );
  }

  if (role === 'platform_admin') {
    return (
      <Link
        href="/platform"
        className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-bold rounded-xl transition-colors shrink-0"
      >
        <Building2 className="w-4 h-4" />
        Platform portal
      </Link>
    );
  }

  return (
    <Link
      href="/arcades/apply"
      className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
    >
      <PlusCircle className="w-4 h-4" />
      Register your arcade
    </Link>
  );
}

// ── Tournaments page banner ────────────────────────────────────────────────
export function TournamentPageCTA() {
  const role = useRole();
  if (role === null) return null;

  if (role === 'arcade_owner') {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-5 py-3.5 flex-wrap">
        <div>
          <p className="text-yellow-400 font-bold text-sm">You're an arcade manager</p>
          <p className="text-zinc-400 text-xs mt-0.5">Create and manage tournaments from your admin panel.</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold text-sm rounded-lg transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Create Tournament
        </Link>
      </div>
    );
  }

  if (role === 'platform_admin') {
    return null;
  }

  if (role === 'player') {
    return null;
  }

  // Guest
  return (
    <div className="mb-6 flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3.5 flex-wrap">
      <p className="text-zinc-400 text-sm">Create an account to enter tournaments and track your performance.</p>
      <Link
        href="/signup"
        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition-colors shrink-0"
      >
        <UserPlus className="w-4 h-4" />
        Join free
      </Link>
    </div>
  );
}

// ── Leaderboard page banner ────────────────────────────────────────────────
export function LeaderboardPageCTA() {
  const role = useRole();
  if (role === null || role !== 'guest') return null;

  return (
    <div className="mb-8 flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex-wrap">
      <div>
        <p className="text-white font-bold text-sm">Compete to appear here</p>
        <p className="text-zinc-400 text-xs mt-0.5">Register and play in tournaments to earn NexCade points.</p>
      </div>
      <Link
        href="/signup"
        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition-colors shrink-0"
      >
        <Trophy className="w-4 h-4" />
        Join free
      </Link>
    </div>
  );
}

// ── Live page CTA (shown in the no-streams placeholder) ────────────────────
export function LivePageCTA() {
  const role = useRole();
  if (role === null) return null;

  if (role === 'arcade_owner') {
    return (
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 font-bold text-sm rounded-xl transition-colors"
      >
        <Tv className="w-4 h-4" />
        Set up a stream for your next tournament
      </Link>
    );
  }

  if (role === 'player') {
    return (
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors"
      >
        <BarChart2 className="w-4 h-4" />
        Browse open tournaments
      </Link>
    );
  }

  if (role === 'platform_admin') {
    return null;
  }

  // Guest
  return (
    <Link
      href="/signup"
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors"
    >
      <UserPlus className="w-4 h-4" />
      Join NexCade — free
    </Link>
  );
}
