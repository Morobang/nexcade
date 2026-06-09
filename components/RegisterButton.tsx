'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Props {
  tournamentId: string;
  spotsLeft: number;
}

export function RegisterButton({ tournamentId, spotsLeft }: Props) {
  const router = useRouter();

  if (spotsLeft <= 0) {
    return (
      <button
        disabled
        className="mt-1 w-full py-3 rounded-lg bg-zinc-800 text-zinc-500 font-bold cursor-not-allowed"
      >
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

  return (
    <button
      onClick={handleClick}
      className="mt-1 w-full text-center py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
    >
      Register Now
    </button>
  );
}
