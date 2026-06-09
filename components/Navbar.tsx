'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/arcades',     label: 'Arcades'      },
  { href: '/leaderboard', label: 'Leaderboard'  },
  { href: '/live',        label: 'Live'          },
  { href: '/news',        label: 'News'          },
];

export function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  function closeMobile() { setMobileOpen(false); }

  async function handleSignOut() {
    closeMobile();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-[1001]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" onClick={closeMobile} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <span className="text-xl font-black text-white hidden sm:inline">NexCade</span>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-zinc-300 hover:text-white transition-colors font-medium">
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Auth buttons — desktop only */}
            {session !== undefined && (
              session ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/dashboard"
                    className="flex items-center gap-1.5 px-4 py-2 text-zinc-200 hover:text-white transition-colors font-medium text-sm">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-4 py-2 text-zinc-400 hover:text-white transition-colors font-medium text-sm">
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/login"
                    className="px-4 py-2 text-zinc-200 hover:text-white transition-colors font-medium">
                    Login
                  </Link>
                  <Link href="/signup"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
                    Sign Up
                  </Link>
                </div>
              )
            )}

            {/* Hamburger button — mobile only */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className="px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 font-medium text-sm transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="h-px bg-zinc-800 my-2" />

            {session ? (
              <>
                <Link href="/dashboard" onClick={closeMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 font-medium text-sm transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 font-medium text-sm transition-colors w-full text-left">
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-1">
                <Link href="/login" onClick={closeMobile}
                  className="flex-1 text-center px-4 py-3 rounded-xl border border-zinc-700 text-zinc-200 hover:border-zinc-500 font-semibold text-sm transition-colors">
                  Login
                </Link>
                <Link href="/signup" onClick={closeMobile}
                  className="flex-1 text-center px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
