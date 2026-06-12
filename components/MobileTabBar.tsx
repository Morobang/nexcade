'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Home, Trophy, Building2, BarChart2, LayoutDashboard, User,
} from 'lucide-react';

const GUEST_TABS = [
  { href: '/',            label: 'Home',        icon: Home          },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy        },
  { href: '/arcades',     label: 'Arcades',     icon: Building2     },
  { href: '/leaderboard', label: 'Rankings',    icon: BarChart2     },
];

const AUTH_TABS = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy          },
  { href: '/arcades',     label: 'Arcades',     icon: Building2       },
  { href: '/leaderboard', label: 'Rankings',    icon: BarChart2       },
  { href: '/settings',    label: 'Account',     icon: User            },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const tabs = loggedIn ? AUTH_TABS : GUEST_TABS;

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-[1000] bg-zinc-950 border-t border-zinc-800 safe-area-inset-bottom">
      <div className="flex items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                active ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-semibold leading-none ${active ? 'text-red-500' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500 rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
