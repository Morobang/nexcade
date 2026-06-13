import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { ApplicationForm } from './ApplicationForm';
import { getServerAuth } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Register your arcade — NexCade',
  description: 'Apply to list your gaming arcade on NexCade and start running tournaments.',
};

export default async function ApplyPage() {
  const { supabase, user } = await getServerAuth();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role === 'arcade_owner') redirect('/admin');
    if (profile?.role === 'platform_admin') redirect('/platform');
  }
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center mb-5">
          <Building2 className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="font-display text-5xl text-white mb-3">REGISTER YOUR ARCADE</h1>
        <p className="text-zinc-400 text-base leading-relaxed max-w-md">
          List your arcade on NexCade and start hosting tournaments. Fill in the details below — we review every application manually.
        </p>
      </div>

      <ApplicationForm />
    </div>
  );
}
