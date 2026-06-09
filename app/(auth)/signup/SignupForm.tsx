'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArcadeCombobox } from './ArcadeCombobox';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

type Arcade = { id: string; name: string; city: string };

interface Props {
  arcades: Arcade[];
}

type Fields = {
  full_name: string;
  gamer_tag: string;
  email: string;
  password: string;
  phone: string;
  home_arcade_id: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;

function validate(f: Fields): FieldErrors {
  const errors: FieldErrors = {};

  if (!f.full_name.trim()) errors.full_name = 'Full name is required.';
  else if (f.full_name.trim().length < 2) errors.full_name = 'Must be at least 2 characters.';

  if (!f.gamer_tag.trim()) errors.gamer_tag = 'Gamer tag is required.';
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(f.gamer_tag.trim()))
    errors.gamer_tag = 'Letters, numbers, underscores only. 3–20 characters.';

  if (!f.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = 'Enter a valid email address.';

  if (!f.password) errors.password = 'Password is required.';
  else if (f.password.length < 8) errors.password = 'Password must be at least 8 characters.';

  if (!f.phone.trim()) errors.phone = 'WhatsApp number is required.';
  else if (!/^\+?[0-9\s\-(]{7,15}$/.test(f.phone.trim()))
    errors.phone = 'Enter a valid phone number.';

  return errors;
}

export function SignupForm({ arcades }: Props) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [fields, setFields] = useState<Fields>({
    full_name: '',
    gamer_tag: '',
    email: '',
    password: '',
    phone: '',
    home_arcade_id: '',
  });

  function set(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError('');

    const errors = validate(fields);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      // All profile data passed in options.data — the DB trigger reads it and
      // creates the profile row as SECURITY DEFINER, bypassing RLS.
      const { error: authError } = await supabase.auth.signUp({
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
        options: {
          data: {
            full_name: fields.full_name.trim(),
            gamer_tag: fields.gamer_tag.trim(),
            phone: fields.phone.trim(),
            home_arcade_id: fields.home_arcade_id || null,
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setFieldErrors({ email: 'An account with this email already exists.' });
        } else {
          setGlobalError(authError.message);
        }
        setSubmitting(false);
        return;
      }

      // Check for pending tournament registration
      const pendingId =
        typeof window !== 'undefined' ? localStorage.getItem('pendingTourneyId') : null;

      if (pendingId) {
        localStorage.removeItem('pendingTourneyId');
        router.push(`/register/${pendingId}`);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setGlobalError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

      {globalError && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {globalError}
        </div>
      )}

      <Field label="Full name" error={fieldErrors.full_name} required>
        <input
          type="text"
          autoComplete="name"
          value={fields.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          placeholder="Thabo Mokoena"
          className={inputClass(!!fieldErrors.full_name)}
        />
      </Field>

      <Field
        label="Gamer tag"
        hint="Letters, numbers and underscores only. This is your public handle."
        error={fieldErrors.gamer_tag}
        required
      >
        <input
          type="text"
          autoComplete="username"
          value={fields.gamer_tag}
          onChange={(e) => set('gamer_tag', e.target.value)}
          placeholder="BlazeSA"
          className={inputClass(!!fieldErrors.gamer_tag)}
        />
      </Field>

      <Field label="Email" error={fieldErrors.email} required>
        <input
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="you@example.com"
          className={inputClass(!!fieldErrors.email)}
        />
      </Field>

      <Field label="Password" hint="At least 8 characters." error={fieldErrors.password} required>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={fields.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="••••••••"
            className={`${inputClass(!!fieldErrors.password)} pr-10`}
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
      </Field>

      <Field
        label="WhatsApp number"
        hint="Used for event reminders and confirmations."
        error={fieldErrors.phone}
        required
      >
        <input
          type="tel"
          autoComplete="tel"
          value={fields.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+27 71 234 5678"
          className={inputClass(!!fieldErrors.phone)}
        />
      </Field>

      <Field
        label="Home arcade"
        hint="The arcade you play at most — optional."
        error={fieldErrors.home_arcade_id}
      >
        <ArcadeCombobox
          arcades={arcades}
          value={fields.home_arcade_id}
          onChange={(id) => set('home_arcade_id', id)}
          hasError={!!fieldErrors.home_arcade_id}
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2 mt-1"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
          Log in
        </Link>
      </p>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-4 py-2.5 rounded-xl bg-zinc-800 border text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none transition-colors ${
    hasError
      ? 'border-red-500 focus:border-red-400'
      : 'border-zinc-700 focus:border-red-500'
  }`;
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-zinc-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-600">{hint}</p>}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
