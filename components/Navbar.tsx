'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { LogOut, LayoutDashboard, Menu, X, ShieldCheck, ChevronDown } from 'lucide-react';

const NAV_LINKS = [
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/arcades',     label: 'Arcades'      },
  { href: '/leaderboard', label: 'Leaderboard'  },
  { href: '/live',        label: 'Live'          },
  { href: '/news',        label: 'News'          },
];

type UserProfile = {
  gamer_tag: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
};

export function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase
      .from('profiles')
      .select('gamer_tag, full_name, avatar_url, role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data as UserProfile | null));
  }, [session]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function closeMobile() { setMobileOpen(false); }

  async function handleSignOut() {
    closeMobile();
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const initials = profile
    ? profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  const isAdmin = profile?.role === 'arcade_owner' || profile?.role === 'platform_admin';

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

            {/* Auth area — desktop */}
            {session !== undefined && (
              session && profile ? (
                <div className="hidden md:flex items-center gap-2">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 text-xs font-bold transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Admin
                    </Link>
                  )}

                  {/* Avatar dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen((o) => !o)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden">
                        {profile.avatar_url
                          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                          : <span className="text-white font-black text-xs">{initials}</span>
                        }
                      </div>
                      <span className="text-sm font-semibold text-zinc-200 max-w-[100px] truncate">{profile.gamer_tag}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-zinc-800">
                          <p className="text-white font-bold text-sm truncate">{profile.gamer_tag}</p>
                          <p className="text-zinc-500 text-xs truncate">{profile.full_name}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-zinc-800 transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Admin panel
                            </Link>
                          )}
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : !session ? (
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
              ) : null
            )}

            {/* Hamburger — mobile */}
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

            {/* User info — mobile */}
            {session && profile && (
              <div className="flex items-center gap-3 px-4 py-3 mb-1">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                    : <span className="text-white font-black text-xs">{initials}</span>
                  }
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{profile.gamer_tag}</p>
                  <p className="text-zinc-500 text-xs">{profile.full_name}</p>
                </div>
              </div>
            )}

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
                {isAdmin && (
                  <Link href="/admin" onClick={closeMobile}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-yellow-400 hover:text-yellow-300 hover:bg-zinc-800 font-medium text-sm transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                    Admin panel
                  </Link>
                )}
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
