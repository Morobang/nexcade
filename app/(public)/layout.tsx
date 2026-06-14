import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileTabBar } from '@/components/MobileTabBar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer className="hidden md:block" />
      <MobileTabBar />
    </>
  );
}
