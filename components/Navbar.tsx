'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  LogOut, LayoutDashboard, Menu, X, ShieldCheck,
  ChevronDown, Building2, Bell, Sun, Moon, Settings,
} from 'lucide-react';

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
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
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
  }, [session, pathname]);

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

  const isArcadeOwner = profile?.role === 'arcade_owner';
  const isPlatformAdmin = profile?.role === 'platform_admin';
  const isDark = !mounted || resolvedTheme !== 'light';

  return (
    <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-[1001]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" onClick={closeMobile} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <span className="text-xl font-black text-zinc-900 dark:text-white hidden sm:inline">NexCade</span>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-6 mx-6 flex-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium text-sm whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1">

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Auth area — desktop */}
            {session !== undefined && (
              session && profile ? (
                <div className="hidden md:flex items-center gap-1">

                  {/* Role badges */}
                  {isArcadeOwner && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 text-xs font-bold transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Admin
                    </Link>
                  )}
                  {isPlatformAdmin && (
                    <Link
                      href="/platform"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Platform
                    </Link>
                  )}

                  {/* Notification bell */}
                  <button
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  {/* Avatar dropdown */}
                  <div className="relative ml-1" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen((o) => !o)}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden hover:ring-2 hover:ring-red-500/50 transition-all"
                    >
                      {profile.avatar_url
                        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                        : <span className="text-white font-black text-xs">{initials}</span>
                      }
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">

                        {/* Profile header — big avatar + name + email */}
                        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden">
                            {profile.avatar_url
                              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                              : <span className="text-white font-black text-xl">{initials}</span>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-zinc-900 dark:text-white font-bold text-base truncate">{profile.gamer_tag}</p>
                            <p className="text-zinc-500 text-xs truncate">{profile.full_name}</p>
                            {session?.user.email && (
                              <p className="text-zinc-400 text-xs truncate mt-0.5">{session.user.email}</p>
                            )}
                          </div>
                        </div>

                        {/* Primary links */}
                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 shrink-0" />
                            My Dashboard
                          </Link>
                          <Link
                            href="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Settings className="w-4 h-4 shrink-0" />
                            Account settings
                          </Link>
                        </div>

                        {/* Role-based links */}
                        {(isArcadeOwner || isPlatformAdmin) && (
                          <div className="border-t border-zinc-200 dark:border-zinc-800 py-1">
                            {isArcadeOwner && (
                              <Link
                                href="/admin"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-3 px-5 py-3 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <Building2 className="w-4 h-4 shrink-0" />
                                Arcade admin panel
                              </Link>
                            )}
                            {isPlatformAdmin && (
                              <Link
                                href="/platform"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-3 px-5 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                Platform portal
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Sign out */}
                        <div className="border-t border-zinc-200 dark:border-zinc-800 py-1">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors w-full text-left"
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : !session ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : null
            )}

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">

            {/* User info — mobile */}
            {session && profile && (
              <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                    : <span className="text-white font-black text-sm">{initials}</span>
                  }
                </div>
                <div>
                  <p className="text-zinc-900 dark:text-white font-bold text-sm">{profile.gamer_tag}</p>
                  <p className="text-zinc-500 text-xs">{profile.full_name}</p>
                </div>
              </div>
            )}

            {/* Nav links */}
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className="px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />

            {/* Theme toggle — mobile */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors w-full text-left"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </button>
            )}

            {session ? (
              <>
                <Link href="/dashboard" onClick={closeMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  My Dashboard
                </Link>
                <Link href="/dashboard" onClick={closeMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                {isArcadeOwner && (
                  <Link href="/admin" onClick={closeMobile}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-yellow-600 dark:text-yellow-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors">
                    <Building2 className="w-4 h-4" />
                    Admin panel
                  </Link>
                )}
                {isPlatformAdmin && (
                  <Link href="/platform" onClick={closeMobile}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                    Platform portal
                  </Link>
                )}
                <button onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors w-full text-left">
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-1">
                <Link href="/login" onClick={closeMobile}
                  className="flex-1 text-center px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 font-semibold text-sm transition-colors">
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
