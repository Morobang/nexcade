import type { Metadata } from 'next';
import { Bebas_Neue, Barlow } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexcade.co.za';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'NexCade',
    template: '%s | NexCade',
  },
  description:
    "South Africa's gaming arcade tournament platform. Compete, rank up, and represent your arcade.",
  keywords: ['gaming', 'tournaments', 'arcades', 'south africa', 'esports', 'tekken', 'street fighter', 'FC26', 'Tekken 8'],
  openGraph: {
    type: 'website',
    siteName: 'NexCade',
    title: 'NexCade — SA Gaming Tournaments',
    description: "South Africa's gaming arcade tournament platform. Compete, rank up, and represent your arcade.",
    url: APP_URL,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'NexCade' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexCade — SA Gaming Tournaments',
    description: "South Africa's gaming arcade tournament platform.",
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bebasNeue.variable} ${barlow.variable} antialiased`}>
      <body className="min-h-screen bg-page text-fg flex flex-col">
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
