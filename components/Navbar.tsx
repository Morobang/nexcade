'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { LogOut, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-[1001]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <span className="text-xl font-black text-white hidden sm:inline">NexCade</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/tournaments" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Tournaments
            </Link>
            <Link href="/arcades" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Arcades
            </Link>
            <Link href="/leaderboard" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Leaderboard
            </Link>
            <Link href="/live" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Live
            </Link>
            <Link href="/news" className="text-zinc-300 hover:text-white transition-colors font-medium">
              News
            </Link>
          </div>

          {/* Auth buttons — undefined means still loading, avoid flash */}
          {session === undefined ? (
            <div className="w-32" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 text-zinc-200 hover:text-white transition-colors font-medium text-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-4 py-2 text-zinc-400 hover:text-white transition-colors font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-zinc-200 hover:text-white transition-colors font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}
