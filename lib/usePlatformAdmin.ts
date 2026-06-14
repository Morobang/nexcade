'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export type PlatformAuthState = 'loading' | 'ok' | 'denied';

export function usePlatformAdmin(): PlatformAuthState {
  const router = useRouter();
  const [state, setState] = useState<PlatformAuthState>('loading');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setState(data?.role === 'platform_admin' ? 'ok' : 'denied');
    });
  }, [router]);

  return state;
}
