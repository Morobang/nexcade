'use client';

import dynamic from 'next/dynamic';
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
  arcade: ArcadeMapItem;
}

export function ArcadeProfileMap({ arcade }: Props) {
  return (
    <div className="h-52 rounded-xl overflow-hidden border border-zinc-800">
      <ArcadeMap arcades={[arcade]} nearestId={arcade.id} />
    </div>
  );
}
