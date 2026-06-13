import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/auth-server';

export default async function ArcadeAdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['arcade_owner', 'platform_admin'].includes(profile?.role ?? '')) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
