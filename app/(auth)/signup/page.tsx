import type { Metadata } from 'next';
import { serverSupabase } from '@/lib/supabase-server';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free NexCade player account and start competing.',
};

export default async function SignupPage() {
  const { data } = await serverSupabase
    .from('arcades')
    .select('id, name, city')
    .eq('is_active', true)
    .order('city')
    .order('name');

  const arcades = data ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-red-600/30">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <h1 className="font-display text-4xl text-white">CREATE ACCOUNT</h1>
          <p className="text-zinc-500 text-sm mt-1">Free to sign up. Start competing today.</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
          <SignupForm arcades={arcades} />
        </div>

      </div>
    </div>
  );
}
