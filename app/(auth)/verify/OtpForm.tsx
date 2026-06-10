'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Props {
  email: string;
}

export function OtpForm({ email }: Props) {
  const router = useRouter();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function handleDigitChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    if (cleaned.length > 1) {
      // Handle paste: distribute digits across inputs
      const pasted = cleaned.slice(0, 6);
      const next = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) next[index + i] = pasted[i];
      }
      setDigits(next);
      const focusIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    setError('');

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = digits.join('');
    if (token.length < 6) {
      setError('Enter all 6 digits of your code.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (verifyError) {
      const msg = verifyError.message.toLowerCase();
      if (msg.includes('expired')) {
        setError('This code has expired. Request a new one below.');
      } else if (msg.includes('invalid') || msg.includes('incorrect')) {
        setError('Incorrect code. Double-check and try again.');
      } else {
        setError(verifyError.message);
      }
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setSubmitting(false);
      return;
    }

    const pendingId =
      typeof window !== 'undefined' ? localStorage.getItem('pendingTourneyId') : null;

    if (pendingId) {
      localStorage.removeItem('pendingTourneyId');
      router.push(`/register/${pendingId}`);
    } else {
      router.push('/dashboard');
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setResendSuccess(false);
    setError('');

    const { error: resendError } = await supabase.auth.signInWithOtp({ email });

    setResending(false);

    if (resendError) {
      setError('Could not resend the code. Please try again.');
      return;
    }

    setResendSuccess(true);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();

    let secs = 60;
    setResendCooldown(secs);
    cooldownRef.current = setInterval(() => {
      secs -= 1;
      setResendCooldown(secs);
      if (secs <= 0 && cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
    }, 1000);
  }

  const code = digits.join('');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <p className="text-zinc-400 text-sm text-center leading-relaxed">
        We sent a 6-digit code to{' '}
        <span className="text-white font-semibold break-all">{email}</span>
      </p>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {resendSuccess && !error && (
        <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700/50 rounded-xl text-sm text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          New code sent — check your inbox.
        </div>
      )}

      {/* 6-digit input grid */}
      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={d}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl bg-zinc-800 border text-zinc-100 focus:outline-none transition-colors ${
              error ? 'border-red-500 focus:border-red-400' : 'border-zinc-700 focus:border-red-500'
            }`}
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={submitting || code.length < 6}
        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Verifying…' : 'Verify code'}
      </button>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {resending
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
            : resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : <><RefreshCw className="w-3.5 h-3.5" />Resend code</>
          }
        </button>

        <Link
          href="/login"
          className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Back to login
        </Link>
      </div>
    </form>
  );
}
