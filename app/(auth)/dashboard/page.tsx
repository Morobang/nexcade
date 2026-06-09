'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Loader2, Trophy, Calendar, Star } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login');
      } else {
        setUser(data.user);
      }
    });
  }, [router]);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  const gamerTag = (user?.user_metadata?.gamer_tag ?? user?.email?.split('@')[0] ?? 'Player') as string;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="mb-10">
        <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Welcome back</p>
        <h1 className="font-display text-5xl text-white">{gamerTag.toUpperCase()}</h1>
      </div>

      {/* Placeholder cards — full dashboard built in Issue #23 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {[
          { icon: Trophy, label: 'My tournaments', href: '/tournaments', color: 'text-yellow-400' },
          { icon: Calendar, label: 'Upcoming events', href: '/tournaments', color: 'text-blue-400' },
          { icon: Star, label: 'Leaderboard rank', href: '/leaderboard', color: 'text-red-400' },
        ].map(({ icon: Icon, label, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3 hover:border-zinc-600 transition-all group"
          >
            <Icon className={`w-6 h-6 ${color}`} />
            <p className="text-zinc-200 font-semibold group-hover:text-white transition-colors">{label}</p>
            <p className="text-zinc-600 text-xs">Full stats coming soon</p>
          </Link>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-500 text-sm">
          Your full player dashboard is coming in a future update.
          In the meantime, browse{' '}
          <Link href="/tournaments" className="text-red-400 hover:text-red-300">tournaments</Link>
          {' '}or check the{' '}
          <Link href="/leaderboard" className="text-red-400 hover:text-red-300">leaderboard</Link>.
        </p>
      </div>
    </div>
  );
}
