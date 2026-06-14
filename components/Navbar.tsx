'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  LogOut, LayoutDashboard, Building2, Bell,
  Sun, Moon, Settings, Trophy, History,
  ClipboardList, Banknote, Radio, Users, User, Home,
} from 'lucide-react';
import { SearchTrigger, GlobalSearch } from '@/components/GlobalSearch';

const GUEST_NAV = [
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/arcades',     label: 'Arcades'     },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/live',        label: 'Live'        },
  { href: '/news',        label: 'News'        },
];

const PLAYER_NAV = [
  { href: '/dashboard',      label: 'Dashboard'   },
  { href: '/my-tournaments', label: 'Tournaments' },
  { href: '/my-arcade',      label: 'My Arcade'   },
  { href: '/live',           label: 'Live'        },
  { href: '/leaderboard',    label: 'Leaderboard' },
];

const ARCADE_NAV = [
  { href: '/admin',               label: 'Overview'      },
  { href: '/admin/tournaments',   label: 'Tournaments'   },
  { href: '/admin/registrations', label: 'Registrations' },
  { href: '/admin/revenue',       label: 'Revenue'       },
  { href: '/admin/stream',        label: 'Stream'        },
];

const PLATFORM_NAV = [
  { href: '/platform',              label: 'Overview'     },
  { href: '/platform/arcades',      label: 'Arcades'      },
  { href: '/platform/applications', label: 'Applications' },
  { href: '/platform/users',        label: 'Users'        },
  { href: '/platform/seasons',      label: 'Seasons'      },
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  async function handleSignOut() {
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

  const navLinks = !session
    ? GUEST_NAV
    : isPlatformAdmin
    ? PLATFORM_NAV
    : isArcadeOwner
    ? ARCADE_NAV
    : PLAYER_NAV;

  function isActive(href: string) {
    if (href === '/admin' || href === '/platform') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  const close = () => setDropdownOpen(false);

  return (
    <>
    <nav className="bg-page border-b border-stroke sticky top-0 z-[1001]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <span className="text-xl font-black text-fg hidden sm:inline">NexCade</span>
          </Link>

          {/* Nav links — desktop only */}
          <div className="hidden md:flex items-center gap-6 mx-6 flex-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive(href) ? 'text-fg' : 'text-fg-2 hover:text-fg'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Search trigger */}
          <SearchTrigger onClick={() => setSearchOpen(true)} />

          {/* Right side */}
          <div className="flex items-center gap-1">

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-fg-3 hover:text-fg hover:bg-elevated transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {session !== undefined && (
              session && profile ? (
                <div className="flex items-center gap-1">

                  {/* Notification bell */}
                  <Link
                    href="/notifications"
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-fg-3 hover:text-fg hover:bg-elevated transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                  </Link>

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
                      <div className="absolute right-0 top-full mt-3 w-72 bg-surface border border-stroke rounded-xl shadow-2xl overflow-hidden z-50">

                        {/* Profile header */}
                        <div className="px-5 py-4 border-b border-stroke flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden">
                            {profile.avatar_url
                              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                              : <span className="text-white font-black text-xl">{initials}</span>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-fg font-bold text-base truncate">{profile.gamer_tag}</p>
                            <p className="text-fg-3 text-xs truncate">{profile.full_name}</p>
                            {session?.user.email && (
                              <p className="text-fg-3 text-xs truncate mt-0.5">{session.user.email}</p>
                            )}
                          </div>
                        </div>

                        {/* Role-specific menu items */}
                        {isPlatformAdmin ? (
                          <>
                            <div className="py-1">
                              <DropItem href="/platform"              icon={LayoutDashboard} label="Platform Overview"  onClick={close} />
                              <DropItem href="/platform/arcades"      icon={Building2}       label="All Arcades"        onClick={close} />
                              <DropItem href="/platform/applications" icon={ClipboardList}   label="Applications"       onClick={close} />
                              <DropItem href="/platform/users"        icon={Users}           label="All Users"          onClick={close} />
                              <DropItem href="/platform/revenue"      icon={Banknote}        label="Revenue"            onClick={close} />
                            </div>
                          </>
                        ) : isArcadeOwner ? (
                          <>
                            <div className="py-1">
                              <DropItem href="/admin"               icon={LayoutDashboard} label="Admin Overview"  onClick={close} />
                              <DropItem href="/admin/tournaments"   icon={Trophy}          label="My Tournaments"  onClick={close} />
                              <DropItem href="/admin/registrations" icon={ClipboardList}   label="Registrations"   onClick={close} />
                              <DropItem href="/admin/revenue"       icon={Banknote}        label="Revenue"         onClick={close} />
                              <DropItem href="/admin/stream"        icon={Radio}           label="Stream"          onClick={close} />
                            </div>
                            <div className="border-t border-stroke py-1">
                              <DropItem href="/admin/settings" icon={Settings} label="Arcade Settings" onClick={close} />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="py-1">
                              <DropItem href="/dashboard"                    icon={LayoutDashboard} label="My Dashboard"   onClick={close} />
                              <DropItem href="/my-tournaments"               icon={Trophy}          label="My Tournaments" onClick={close} />
                              <DropItem href="/my-arcade"                    icon={Home}            label="My Arcade"      onClick={close} />
                              <DropItem href={`/profile/${session.user.id}`} icon={User}            label="My Profile"     onClick={close} />
                            </div>
                            <div className="border-t border-stroke py-1">
                              <DropItem href="/notifications" icon={Bell}     label="Notifications" onClick={close} />
                              <DropItem href="/settings"      icon={Settings} label="Settings"       onClick={close} />
                            </div>
                          </>
                        )}

                        {/* Sign out — always last */}
                        <div className="border-t border-stroke py-1">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-fg-3 hover:text-fg hover:bg-elevated transition-colors w-full text-left"
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
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-2 text-fg-2 hover:text-fg transition-colors font-medium text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : null
            )}
          </div>

        </div>
      </div>
    </nav>

    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

// ── Dropdown helper ───────────────────────────────────────────────────────────

function DropItem({
  href, icon: Icon, label, onClick, className = '',
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3 text-sm hover:bg-elevated transition-colors ${
        className || 'text-fg-2 hover:text-fg'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}
