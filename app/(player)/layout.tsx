import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/auth-server';
import { Navbar } from '@/components/Navbar';
import { MobileTabBar } from '@/components/MobileTabBar';

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getServerAuth();
  if (!user) redirect('/login');
  return (
    <>
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <MobileTabBar />
    </>
  );
}
