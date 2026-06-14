import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/auth-server';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getServerAuth();
  if (user) redirect('/dashboard');
  return <main className="flex-1 min-h-screen">{children}</main>;
}
