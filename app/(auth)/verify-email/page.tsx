import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify your email',
};

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="font-display text-4xl text-white mb-3">CHECK YOUR EMAIL</h1>
        <p className="text-zinc-400 text-base leading-relaxed mb-2">
          We sent a confirmation link to your email address.
        </p>
        <p className="text-zinc-500 text-sm mb-8">
          Click the link to activate your account, then come back to log in.
          The link expires in 24 hours.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8 text-left text-sm text-zinc-400">
          <p className="font-semibold text-zinc-300 mb-2">Didn&apos;t receive it?</p>
          <ul className="space-y-1.5 list-disc list-inside text-zinc-500">
            <li>Check your spam or junk folder.</li>
            <li>Make sure you entered the correct email.</li>
            <li>Wait a minute — it can sometimes be delayed.</li>
          </ul>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
