'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  tournamentId: string;
  spotsLeft: number;
}

type State = 'loading' | 'registered' | 'open' | 'full' | 'guest';

export function RegisterButton({ tournamentId, spotsLeft }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(spotsLeft <= 0 ? 'full' : 'guest');
        return;
      }
      if (spotsLeft <= 0) {
        setState('full');
        return;
      }
      const { count } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)
        .eq('profile_id', session.user.id)
        .neq('registration_status', 'cancelled');
      setState((count ?? 0) > 0 ? 'registered' : 'open');
    }
    check();
  }, [tournamentId, spotsLeft]);

  if (state === 'loading') {
    return (
      <button disabled className="mt-1 w-full py-3 rounded-lg bg-zinc-800 text-zinc-500 font-bold flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  if (state === 'registered') {
    return (
      <div className="mt-1 flex flex-col gap-2">
        <div className="w-full py-3 rounded-lg bg-green-600/20 border border-green-600/30 text-green-400 font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          You&apos;re Registered
        </div>
        <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300 text-center transition-colors">
          View in dashboard
        </Link>
      </div>
    );
  }

  if (state === 'full') {
    return (
      <button disabled className="mt-1 w-full py-3 rounded-lg bg-zinc-800 text-zinc-500 font-bold cursor-not-allowed">
        Tournament Full
      </button>
    );
  }

  async function handleClick() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      router.push(`/register/${tournamentId}`);
    } else {
      localStorage.setItem('pendingTourneyId', tournamentId);
      router.push('/login');
    }
  }

  // state === 'open' or 'guest'
  return (
    <button
      onClick={handleClick}
      className="mt-1 w-full text-center py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
    >
      Register Now
    </button>
  );
}
