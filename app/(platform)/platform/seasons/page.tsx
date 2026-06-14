'use client';

import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { Loader2, Calendar } from 'lucide-react';

export default function PlatformSeasonsPage() {
  const authState = usePlatformAdmin();

  if (authState === 'loading') {
    return (
      <PlatformShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-fg-3 animate-spin" />
        </div>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8">
          <h1 className="font-display text-3xl text-fg mb-1">SEASONS</h1>
          <p className="text-fg-3 text-sm">Manage season dates and points configuration.</p>
        </div>

        <div className="bg-surface border border-stroke rounded-2xl p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-elevated border border-stroke flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-fg-3" />
          </div>
          <p className="text-fg font-semibold mb-1">Season management coming soon</p>
          <p className="text-fg-3 text-sm max-w-sm">
            Configure season dates, point multipliers, qualification windows, and prize structures.
            This requires the <code className="text-red-400 text-xs bg-red-400/10 px-1 py-0.5 rounded">seasons</code> table to be set up first.
          </p>
        </div>

      </div>
    </PlatformShell>
  );
}
