'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Bell } from 'lucide-react';
import type { Metadata } from 'next';

export default function NotificationsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setReady(true);
    });
  }, [router]);

  if (!ready) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-fg-3 hover:text-fg-2 text-sm transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <h1 className="font-display text-3xl text-fg mb-2">NOTIFICATIONS</h1>
      <p className="text-fg-3 text-sm mb-10">Updates about your tournaments, registrations, and activity.</p>

      <div className="bg-surface border border-stroke rounded-2xl p-12 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-elevated border border-stroke flex items-center justify-center mb-4">
          <Bell className="w-6 h-6 text-fg-3" />
        </div>
        <p className="text-fg font-semibold mb-1">No notifications yet</p>
        <p className="text-fg-3 text-sm max-w-xs">
          You&apos;ll get notified when tournaments you&apos;re registered in go live, when results are posted, and more.
        </p>
      </div>
    </div>
  );
}
