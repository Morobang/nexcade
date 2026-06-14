'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setError('Incorrect email or password. Please try again.');
      setSubmitting(false);
      return;
    }

    // Explicit ?next= param always takes priority (e.g. coming from a protected page)
    const next = searchParams.get('next');
    if (next && next.startsWith('/')) {
      router.push(next);
      return;
    }

    // Pending tournament registration also takes priority
    const pendingId =
      typeof window !== 'undefined' ? localStorage.getItem('pendingTourneyId') : null;
    if (pendingId) {
      localStorage.removeItem('pendingTourneyId');
      router.push(`/register/${pendingId}`);
      return;
    }

    // Default redirect based on role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'arcade_owner') {
        router.push('/admin');
        return;
      }
      if (profile?.role === 'platform_admin') {
        router.push('/platform');
        return;
      }
    }

    router.push('/dashboard');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-zinc-300">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-300">
            Password <span className="text-red-500">*</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 pr-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2 mt-1"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Logging in…' : 'Log in'}
      </button>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
          Sign up free
        </Link>
      </p>
    </form>
  );
}
