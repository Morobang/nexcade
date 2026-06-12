import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to your NexCade account.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-red-600/30">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <h1 className="font-display text-4xl text-white">WELCOME BACK</h1>
          <p className="text-zinc-500 text-sm mt-1">Log in to your NexCade account.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

      </div>
    </div>
  );
}
