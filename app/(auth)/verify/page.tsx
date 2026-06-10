import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Mail } from 'lucide-react';
import { OtpForm } from './OtpForm';

export const metadata: Metadata = {
  title: 'Enter your code',
};

type SearchParams = Promise<{ email?: string }>;

export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const { email } = await searchParams;

  if (!email) redirect('/login');

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="font-display text-4xl text-white text-center mb-1">ENTER CODE</h1>
        <p className="text-zinc-500 text-sm text-center mb-8">Check your inbox — the code expires in 10 minutes.</p>

        <OtpForm email={email} />
      </div>
    </div>
  );
}
