'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ArcadeCTA({ arcadeName }: { arcadeName: string }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setLoggedIn(!!s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loggedIn === null) return null;

  return (
    <div className="bg-gradient-to-br from-red-600/20 to-zinc-900 border border-red-900/50 rounded-xl p-6 text-center">
      <Trophy className="w-8 h-8 text-red-500 mx-auto mb-3" />
      <h3 className="text-white font-bold mb-2">Ready to compete?</h3>
      <p className="text-zinc-400 text-sm mb-4">
        {loggedIn
          ? `Browse open tournaments at ${arcadeName} and register to earn NexCade points.`
          : `Register for a tournament at ${arcadeName} and start earning NexCade points.`}
      </p>
      {loggedIn ? (
        <Link
          href="/tournaments"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
        >
          Browse Tournaments
        </Link>
      ) : (
        <Link
          href="/signup"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
        >
          Create Account — Free
        </Link>
      )}
    </div>
  );
}
