'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Building2,
  Users, Banknote, Trophy, Crown,
} from 'lucide-react';

const NAV = [
  { href: '/platform',              label: 'Overview',      icon: LayoutDashboard },
  { href: '/platform/applications', label: 'Applications',  icon: ClipboardList   },
  { href: '/platform/arcades',      label: 'Arcades',       icon: Building2       },
  { href: '/platform/users',        label: 'Users',         icon: Users           },
  { href: '/platform/revenue',      label: 'Revenue',       icon: Banknote        },
  { href: '/platform/tournaments',  label: 'Tournaments',   icon: Trophy          },
];

export function PlatformShell({
  children,
  pendingCount = 0,
}: {
  children: React.ReactNode;
  pendingCount?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-zinc-800 bg-zinc-950 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-zinc-800">
          <Crown className="w-4 h-4 text-red-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">Platform</p>
            <p className="text-white font-black text-sm leading-none mt-0.5">NEXCADE</p>
          </div>
        </div>
        <nav className="flex-1 p-2 flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/platform'
              ? pathname === '/platform'
              : pathname.startsWith(href);
            const isApps = href === '/platform/applications';
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-red-600/10 text-red-400 border border-red-600/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {isApps && pendingCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav strip */}
      <div className="lg:hidden w-full absolute">
        <div className="bg-zinc-950 border-b border-zinc-800 overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === '/platform'
                ? pathname === '/platform'
                : pathname.startsWith(href);
              const isApps = href === '/platform/applications';
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                  {isApps && pendingCount > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-white/25 text-white text-[9px] font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content — top padding on mobile for the nav strip (~44px) */}
      <main className="flex-1 min-w-0 lg:pt-0 pt-[52px]">
        {children}
      </main>
    </div>
  );
}
