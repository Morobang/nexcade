'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ArcadeMapItem } from './ArcadeMap';

const ArcadeMap = dynamic(() => import('./ArcadeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-900 animate-pulse flex items-center justify-center">
      <p className="text-zinc-600 text-sm">Loading map…</p>
    </div>
  ),
});

interface Props {
  arcades: ArcadeMapItem[];
}

export function HomepageArcadeMap({ arcades }: Props) {
  return (
    <div className="h-72 sm:h-96 rounded-xl overflow-hidden border border-zinc-800">
      <ArcadeMap arcades={arcades} nearestId={null} />
    </div>
  );
}
