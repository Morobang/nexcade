import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/auth-server';

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getServerAuth();
  if (!user) redirect('/login');
  return <>{children}</>;
}
