'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArcadeCombobox } from './ArcadeCombobox';
import {
  Eye, EyeOff, Loader2, AlertCircle,
  Gamepad2, Building2, ArrowLeft, ArrowRight, Check,
} from 'lucide-react';

type Arcade = { id: string; name: string; city: string };

interface Props {
  arcades: Arcade[];
}

// ── Step 1: account type ──────────────────────────────────────────────────────

type AccountType = 'player' | 'arcade_owner';

// ── Step 2: personal details ──────────────────────────────────────────────────

type PersonalFields = {
  full_name: string;
  gamer_tag: string;
  email: string;
  password: string;
  phone: string;
  home_arcade_id: string;
  terms: boolean;
};

function validatePersonal(f: PersonalFields): Partial<Record<keyof PersonalFields, string>> {
  const e: Partial<Record<keyof PersonalFields, string>> = {};
  if (!f.full_name.trim()) e.full_name = 'Full name is required.';
  else if (f.full_name.trim().length < 2) e.full_name = 'Must be at least 2 characters.';
  if (!f.gamer_tag.trim()) e.gamer_tag = 'Gamer tag is required.';
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(f.gamer_tag.trim()))
    e.gamer_tag = 'Letters, numbers, underscores only. 3–20 characters.';
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address.';
  if (!f.password) e.password = 'Password is required.';
  else if (f.password.length < 8) e.password = 'Password must be at least 8 characters.';
  if (!f.phone.trim()) e.phone = 'WhatsApp number is required.';
  else if (!/^\+?[0-9\s\-(]{7,15}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (!f.terms) e.terms = 'You must agree to the Terms of Service to continue.';
  return e;
}

// ── Step 3: arcade details ────────────────────────────────────────────────────

type ArcadeFields = {
  arcade_name: string;
  city: string;
  address: string;
  contact_email: string;
  whatsapp_number: string;
  description: string;
  console_setup: string;
  games: string[];
};

const GAMES = ['FC26', 'Tekken8', 'SF6', 'MK1', 'KOFXV', 'Naruto'] as const;
const GAME_LABELS: Record<string, string> = {
  FC26: 'EA FC 26', Tekken8: 'Tekken 8', SF6: 'Street Fighter 6',
  MK1: 'Mortal Kombat 1', KOFXV: 'KOF XV', Naruto: 'Naruto Storm',
};

function validateArcade(f: ArcadeFields): Partial<Record<keyof ArcadeFields, string>> {
  const e: Partial<Record<keyof ArcadeFields, string>> = {};
  if (!f.arcade_name.trim()) e.arcade_name = 'Arcade name is required.';
  if (!f.city.trim()) e.city = 'City is required.';
  if (!f.contact_email.trim()) e.contact_email = 'Contact email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact_email)) e.contact_email = 'Enter a valid email.';
  if (f.games.length === 0) e.games = 'Select at least one game.';
  return e;
}

// ── Main component ────────────────────────────────────────────────────────────

export function SignupForm({ arcades }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [personal, setPersonal] = useState<PersonalFields>({
    full_name: '', gamer_tag: '', email: '', password: '',
    phone: '', home_arcade_id: '', terms: false,
  });
  const [personalErrors, setPersonalErrors] = useState<Partial<Record<keyof PersonalFields, string>>>({});

  const [arcadeFields, setArcadeFields] = useState<ArcadeFields>({
    arcade_name: '', city: '', address: '', contact_email: '',
    whatsapp_number: '', description: '', console_setup: '', games: [],
  });
  const [arcadeErrors, setArcadeErrors] = useState<Partial<Record<keyof ArcadeFields, string>>>({});

  function setP<K extends keyof PersonalFields>(k: K, v: PersonalFields[K]) {
    setPersonal((p) => ({ ...p, [k]: v }));
    if (personalErrors[k]) setPersonalErrors((e) => ({ ...e, [k]: undefined }));
  }

  function setA<K extends keyof ArcadeFields>(k: K, v: ArcadeFields[K]) {
    setArcadeFields((f) => ({ ...f, [k]: v }));
    if (arcadeErrors[k]) setArcadeErrors((e) => ({ ...e, [k]: undefined }));
  }

  function toggleGame(game: string) {
    setArcadeFields((f) => ({
      ...f,
      games: f.games.includes(game) ? f.games.filter((g) => g !== game) : [...f.games, game],
    }));
    if (arcadeErrors.games) setArcadeErrors((e) => ({ ...e, games: undefined }));
  }

  function handleSelectType(type: AccountType) {
    setAccountType(type);
    setStep(2);
  }

  function handlePersonalNext(e: React.FormEvent) {
    e.preventDefault();
    const errors = validatePersonal(personal);
    if (Object.keys(errors).length > 0) { setPersonalErrors(errors); return; }
    if (accountType === 'arcade_owner') {
      setArcadeFields((f) => ({ ...f, contact_email: personal.email.trim().toLowerCase() }));
      setStep(3);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    if (accountType === 'arcade_owner') {
      const errors = validateArcade(arcadeFields);
      if (Object.keys(errors).length > 0) { setArcadeErrors(errors); return; }
    }

    setSubmitting(true);
    setGlobalError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: personal.email.trim().toLowerCase(),
        password: personal.password,
        options: {
          data: {
            full_name: personal.full_name.trim(),
            gamer_tag: personal.gamer_tag.trim(),
            phone: personal.phone.trim(),
            home_arcade_id: personal.home_arcade_id || null,
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setPersonalErrors({ email: 'An account with this email already exists.' });
          setStep(2);
        } else {
          setGlobalError(authError.message);
        }
        setSubmitting(false);
        return;
      }

      // If arcade owner, submit the application
      if (accountType === 'arcade_owner' && authData.user) {
        await supabase.from('arcade_applications').insert({
          profile_id:      authData.user.id,
          arcade_name:     arcadeFields.arcade_name.trim(),
          city:            arcadeFields.city.trim(),
          address:         arcadeFields.address.trim() || null,
          contact_email:   arcadeFields.contact_email.trim().toLowerCase(),
          whatsapp_number: arcadeFields.whatsapp_number.trim() || null,
          games_supported: arcadeFields.games,
          description:     arcadeFields.description.trim() || null,
          console_setup:   arcadeFields.console_setup.trim() || null,
        });
      }

      if (!authData.session) {
        router.push(`/verify?email=${encodeURIComponent(personal.email.trim().toLowerCase())}`);
        return;
      }

      const pendingId = typeof window !== 'undefined' ? localStorage.getItem('pendingTourneyId') : null;
      if (pendingId) { localStorage.removeItem('pendingTourneyId'); router.push(`/register/${pendingId}`); }
      else { router.push('/dashboard'); }
    } catch {
      setGlobalError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl bg-zinc-800 border text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none transition-colors ${
      hasError ? 'border-red-500 focus:border-red-400' : 'border-zinc-700 focus:border-red-500'
    }`;

  // ── Step indicator ──────────────────────────────────────────────────────────

  const steps = accountType === 'arcade_owner'
    ? ['Account type', 'Your details', 'Arcade details']
    : ['Account type', 'Your details'];

  // ── STEP 1: Account type ────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest text-center mb-5">Step 1 of 2 — Choose account type</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSelectType('player')}
              className="group flex flex-col items-center gap-4 p-6 bg-zinc-900 border-2 border-zinc-800 hover:border-red-500 rounded-2xl transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 group-hover:bg-red-600/20 flex items-center justify-center transition-colors">
                <Gamepad2 className="w-7 h-7 text-zinc-400 group-hover:text-red-400 transition-colors" />
              </div>
              <div>
                <p className="text-white font-bold text-base mb-1">I&apos;m a Player</p>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Compete in tournaments, climb the leaderboard, earn loyalty rewards.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('arcade_owner')}
              className="group flex flex-col items-center gap-4 p-6 bg-zinc-900 border-2 border-zinc-800 hover:border-yellow-500 rounded-2xl transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 group-hover:bg-yellow-500/20 flex items-center justify-center transition-colors">
                <Building2 className="w-7 h-7 text-zinc-400 group-hover:text-yellow-400 transition-colors" />
              </div>
              <div>
                <p className="text-white font-bold text-base mb-1">I own an Arcade</p>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  List your venue, run tournaments, and manage your players.
                </p>
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-red-400 hover:text-red-300 font-semibold transition-colors">Log in</Link>
        </p>
      </div>
    );
  }

  // ── STEP 2: Personal details ────────────────────────────────────────────────

  if (step === 2) {
    return (
      <form onSubmit={handlePersonalNext} className="flex flex-col gap-5" noValidate>

        <div className="flex items-center gap-3 mb-1">
          <button type="button" onClick={() => setStep(1)}
            className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Step 2 of {accountType === 'arcade_owner' ? 3 : 2} — Your details
          </p>
          {accountType === 'arcade_owner' && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full font-semibold">
              <Building2 className="w-3 h-3" /> Arcade Owner
            </span>
          )}
        </div>

        {globalError && (
          <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{globalError}
          </div>
        )}

        <Field label="Full name" error={personalErrors.full_name} required>
          <input type="text" autoComplete="name" value={personal.full_name}
            onChange={(e) => setP('full_name', e.target.value)}
            placeholder="Thabo Mokoena" className={inputClass(!!personalErrors.full_name)} />
        </Field>

        <Field label="Gamer tag" hint="Letters, numbers and underscores only. Your public handle."
          error={personalErrors.gamer_tag} required>
          <input type="text" autoComplete="username" value={personal.gamer_tag}
            onChange={(e) => setP('gamer_tag', e.target.value)}
            placeholder="BlazeSA" className={inputClass(!!personalErrors.gamer_tag)} />
        </Field>

        <Field label="Email" error={personalErrors.email} required>
          <input type="email" autoComplete="email" value={personal.email}
            onChange={(e) => setP('email', e.target.value)}
            placeholder="you@example.com" className={inputClass(!!personalErrors.email)} />
        </Field>

        <Field label="Password" hint="At least 8 characters." error={personalErrors.password} required>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} autoComplete="new-password"
              value={personal.password} onChange={(e) => setP('password', e.target.value)}
              placeholder="••••••••" className={`${inputClass(!!personalErrors.password)} pr-10`} />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="WhatsApp number" hint="Used for event reminders." error={personalErrors.phone} required>
          <input type="tel" autoComplete="tel" value={personal.phone}
            onChange={(e) => setP('phone', e.target.value)}
            placeholder="+27 71 234 5678" className={inputClass(!!personalErrors.phone)} />
        </Field>

        <Field label="Home arcade" hint="The arcade you play at most — optional.">
          <ArcadeCombobox arcades={arcades} value={personal.home_arcade_id}
            onChange={(id) => setP('home_arcade_id', id)} hasError={false} />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={personal.terms}
              onChange={(e) => setP('terms', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-red-600 shrink-0" />
            <span className="text-sm text-zinc-400 leading-snug">
              I agree to the{' '}
              <Link href="/terms" className="text-red-400 hover:text-red-300 underline" target="_blank">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-red-400 hover:text-red-300 underline" target="_blank">Privacy Policy</Link>
            </span>
          </label>
          {personalErrors.terms && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />{personalErrors.terms}
            </p>
          )}
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2 mt-1">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Creating account…'
            : accountType === 'arcade_owner'
            ? <><span>Next — Arcade details</span><ArrowRight className="w-4 h-4" /></>
            : 'Create account'}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-red-400 hover:text-red-300 font-semibold transition-colors">Log in</Link>
        </p>
      </form>
    );
  }

  // ── STEP 3: Arcade details (arcade_owner only) ──────────────────────────────

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col gap-5" noValidate>

      <div className="flex items-center gap-3 mb-1">
        <button type="button" onClick={() => setStep(2)}
          className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-xs text-zinc-500 uppercase tracking-widest">Step 3 of 3 — Your arcade</p>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full font-semibold">
          <Building2 className="w-3 h-3" /> Arcade Owner
        </span>
      </div>

      {globalError && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{globalError}
        </div>
      )}

      <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-xs text-yellow-400/80 leading-relaxed">
        Your account will be created immediately. Your arcade listing will go live after a quick review by our team — usually within 1–3 business days.
      </div>

      <Field label="Arcade name" error={arcadeErrors.arcade_name} required>
        <input type="text" value={arcadeFields.arcade_name}
          onChange={(e) => setA('arcade_name', e.target.value)}
          placeholder="e.g. Level Up Arcade" className={inputClass(!!arcadeErrors.arcade_name)} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="City" error={arcadeErrors.city} required>
          <input type="text" value={arcadeFields.city}
            onChange={(e) => setA('city', e.target.value)}
            placeholder="e.g. Johannesburg" className={inputClass(!!arcadeErrors.city)} />
        </Field>
        <Field label="Address">
          <input type="text" value={arcadeFields.address}
            onChange={(e) => setA('address', e.target.value)}
            placeholder="Shop 12, Eastgate Mall" className={inputClass(false)} />
        </Field>
      </div>

      <Field label="Games supported" error={arcadeErrors.games} required>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-0.5">
          {GAMES.map((game) => {
            const selected = arcadeFields.games.includes(game);
            return (
              <button key={game} type="button" onClick={() => toggleGame(game)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between gap-2 ${
                  selected
                    ? 'bg-red-600/20 border-red-500/50 text-red-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}>
                <span>{GAME_LABELS[game]}</span>
                {selected && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="About your arcade">
        <textarea value={arcadeFields.description}
          onChange={(e) => setA('description', e.target.value)}
          rows={3} placeholder="Setups, events, vibe — tell us about your spot."
          className={`${inputClass(false)} resize-none`} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Contact email" error={arcadeErrors.contact_email} required>
          <input type="email" value={arcadeFields.contact_email}
            onChange={(e) => setA('contact_email', e.target.value)}
            placeholder="arcade@example.com" className={inputClass(!!arcadeErrors.contact_email)} />
        </Field>
        <Field label="WhatsApp number">
          <input type="tel" value={arcadeFields.whatsapp_number}
            onChange={(e) => setA('whatsapp_number', e.target.value)}
            placeholder="+27 71 234 5678" className={inputClass(false)} />
        </Field>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2 mt-1">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Creating account…' : 'Create account & submit arcade'}
      </button>
    </form>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, hint, error, required, children }: {
  label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-zinc-300">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-600">{hint}</p>}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}
