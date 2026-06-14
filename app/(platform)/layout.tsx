import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/auth-server';
import { Navbar } from '@/components/Navbar';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'platform_admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
}
