'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Crown, LayoutDashboard, ClipboardList, Building2,
  Users, Trophy, Banknote, Calendar,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/platform',              label: 'Overview',      icon: LayoutDashboard },
  { href: '/platform/applications', label: 'Applications',  icon: ClipboardList   },
  { href: '/platform/arcades',      label: 'Arcades',       icon: Building2       },
  { href: '/platform/users',        label: 'Users',         icon: Users           },
  { href: '/platform/revenue',      label: 'Revenue',       icon: Banknote        },
  { href: '/platform/tournaments',  label: 'Tournaments',   icon: Trophy          },
  { href: '/platform/seasons',      label: 'Seasons',       icon: Calendar        },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    supabase
      .from('arcade_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count ?? 0));
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-64px)]">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 sticky top-16 h-[calc(100vh-64px)] bg-surface border-r border-stroke overflow-y-auto">
        <div className="px-3 py-5 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 px-3 mb-4">
            <Crown className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-fg-3 uppercase tracking-widest">Platform</span>
          </div>
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/platform' ? pathname === href : pathname.startsWith(href);
            const badge = href === '/platform/applications' ? pendingCount : 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-red-600/15 text-red-400 border border-red-600/20'
                    : 'text-fg-2 hover:text-fg hover:bg-elevated'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile tab strip */}
      <div className="fixed top-16 left-0 right-0 z-40 md:hidden bg-surface border-b border-stroke">
        <div className="overflow-x-auto flex gap-0.5 px-2 py-1.5" style={{ scrollbarWidth: 'none' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/platform' ? pathname === href : pathname.startsWith(href);
            const badge = href === '/platform/applications' ? pendingCount : 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isActive ? 'bg-red-600 text-white' : 'text-fg-2 hover:text-fg'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {badge > 0 && (
                  <span className={`min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    isActive ? 'bg-white/20 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 min-w-0 pt-[52px] md:pt-0">
        {children}
      </main>

    </div>
  );
}
