import type { Metadata } from 'next';
import { Bebas_Neue, Barlow } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'NexCade',
    template: '%s | NexCade',
  },
  description:
    "South Africa's gaming arcade tournament platform. Compete, rank up, and represent your arcade.",
  keywords: ['gaming', 'tournaments', 'arcades', 'south africa', 'esports', 'tekken', 'street fighter'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${barlow.variable} antialiased`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
