'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArcadeCombobox } from './ArcadeCombobox';
import { CitySearch } from '@/components/CitySearch';
import {
  Eye, EyeOff, Loader2, AlertCircle,
  Gamepad2, Building2, ArrowLeft, ArrowRight, Check, Plus, X,
} from 'lucide-react';

type Arcade = { id: string; name: string; city: string };

interface Props {
  arcades: Arcade[];
}

type AccountType = 'player' | 'arcade_owner';

// ── Step 2: personal details ──────────────────────────────────────────────────

type PersonalFields = {
  full_name: string;
  gamer_tag: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  home_arcade_id: string;
  terms: boolean;
};

function validatePersonal(
  f: PersonalFields,
  accountType: AccountType,
): Partial<Record<keyof PersonalFields, string>> {
  const e: Partial<Record<keyof PersonalFields, string>> = {};
  if (!f.full_name.trim()) e.full_name = 'Full name is required.';
  else if (f.full_name.trim().length < 2) e.full_name = 'Must be at least 2 characters.';
  if (!f.gamer_tag.trim()) {
    e.gamer_tag = accountType === 'player' ? 'Gamer tag is required.' : 'Username is required.';
  } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(f.gamer_tag.trim())) {
    e.gamer_tag = 'Letters, numbers and underscores only. 3–20 characters.';
  }
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address.';
  if (!f.password) e.password = 'Password is required.';
  else if (f.password.length < 8) e.password = 'Password must be at least 8 characters.';
  if (!f.confirm_password) e.confirm_password = 'Please confirm your password.';
  else if (f.confirm_password !== f.password) e.confirm_password = 'Passwords do not match.';
  if (!f.phone.trim()) e.phone = 'WhatsApp number is required.';
  else if (!/^\+?[0-9\s\-(]{7,15}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (!f.terms) e.terms = 'You must agree to the Terms of Service to continue.';
  return e;
}

// ── Step 3: arcade details ────────────────────────────────────────────────────

type ArcadeFields = {
  arcade_name: string;
  city: string;
  city_lat: number | null;
  city_lng: number | null;
  address: string;
  contact_email: string;
  whatsapp_number: string;
  description: string;
  console_setup: string;
  games: string[];
};

const PRESET_GAMES = ['FC26', 'Tekken8', 'SF6', 'MK1', 'KOFXV', 'Naruto'] as const;
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [customGameInput, setCustomGameInput] = useState('');

  const [personal, setPersonal] = useState<PersonalFields>({
    full_name: '', gamer_tag: '', email: '', password: '', confirm_password: '',
    phone: '', home_arcade_id: '', terms: false,
  });
  const [personalErrors, setPersonalErrors] = useState<Partial<Record<keyof PersonalFields, string>>>({});

  const [arcadeFields, setArcadeFields] = useState<ArcadeFields>({
    arcade_name: '', city: '', city_lat: null, city_lng: null,
    address: '', contact_email: '', whatsapp_number: '',
    description: '', console_setup: '', games: [],
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

  function togglePresetGame(game: string) {
    setArcadeFields((f) => ({
      ...f,
      games: f.games.includes(game) ? f.games.filter((g) => g !== game) : [...f.games, game],
    }));
    if (arcadeErrors.games) setArcadeErrors((e) => ({ ...e, games: undefined }));
  }

  function addCustomGame() {
    const name = customGameInput.trim();
    if (!name || arcadeFields.games.includes(name)) return;
    setArcadeFields((f) => ({ ...f, games: [...f.games, name] }));
    setCustomGameInput('');
    if (arcadeErrors.games) setArcadeErrors((e) => ({ ...e, games: undefined }));
  }

  function removeGame(game: string) {
    setArcadeFields((f) => ({ ...f, games: f.games.filter((g) => g !== game) }));
  }

  function handleSelectType(type: AccountType) {
    setAccountType(type);
    setStep(2);
  }

  function handlePersonalNext(e: React.FormEvent) {
    e.preventDefault();
    const errors = validatePersonal(personal, accountType!);
    if (Object.keys(errors).length > 0) { setPersonalErrors(errors); return; }
    if (accountType === 'arcade_owner') {
      setArcadeFields((f) => ({
        ...f,
        contact_email: personal.email.trim().toLowerCase(),
        whatsapp_number: f.whatsapp_number || personal.phone.trim(),
      }));
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

      // No active session yet (email confirmation is on), so we can't insert into arcade_applications
      // directly (RLS would block it). Save to localStorage; OtpForm inserts it after verification.
      if (accountType === 'arcade_owner') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingArcadeApp', JSON.stringify({
            arcade_name:     arcadeFields.arcade_name.trim(),
            city:            arcadeFields.city.trim(),
            city_lat:        arcadeFields.city_lat,
            city_lng:        arcadeFields.city_lng,
            address:         arcadeFields.address.trim() || null,
            contact_email:   arcadeFields.contact_email.trim().toLowerCase(),
            whatsapp_number: arcadeFields.whatsapp_number.trim() || null,
            games_supported: arcadeFields.games,
            description:     arcadeFields.description.trim() || null,
            console_setup:   arcadeFields.console_setup.trim() || null,
          }));
        }
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
    const isOwner = accountType === 'arcade_owner';

    return (
      <form onSubmit={handlePersonalNext} className="flex flex-col gap-5" noValidate>

        <div className="flex items-center gap-3 mb-1">
          <button type="button" onClick={() => setStep(1)}
            className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Step 2 of {isOwner ? 3 : 2} — Your details
          </p>
          {isOwner && (
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

        <Field
          label={isOwner ? 'Username' : 'Gamer tag'}
          hint={isOwner
            ? 'Your unique handle on NexCade — letters, numbers, underscores only.'
            : 'Your public handle — letters, numbers and underscores only.'}
          error={personalErrors.gamer_tag}
          required
        >
          <input type="text" autoComplete="username" value={personal.gamer_tag}
            onChange={(e) => setP('gamer_tag', e.target.value)}
            placeholder={isOwner ? 'LevelUpArcade' : 'BlazeSA'}
            className={inputClass(!!personalErrors.gamer_tag)} />
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

        <Field label="Confirm password" error={personalErrors.confirm_password} required>
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
              value={personal.confirm_password} onChange={(e) => setP('confirm_password', e.target.value)}
              placeholder="••••••••" className={`${inputClass(!!personalErrors.confirm_password)} pr-10`} />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field
          label="WhatsApp number"
          hint="For event reminders and check-in notifications."
          error={personalErrors.phone}
          required
        >
          <input type="tel" autoComplete="tel" value={personal.phone}
            onChange={(e) => setP('phone', e.target.value)}
            placeholder="+27 71 234 5678" className={inputClass(!!personalErrors.phone)} />
        </Field>

        {!isOwner && (
          <Field label="Home arcade" hint="The arcade you play at most — optional.">
            <ArcadeCombobox arcades={arcades} value={personal.home_arcade_id}
              onChange={(id) => setP('home_arcade_id', id)} hasError={false} />
          </Field>
        )}

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
            : isOwner
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

  const customGames = arcadeFields.games.filter((g) => !PRESET_GAMES.includes(g as typeof PRESET_GAMES[number]));

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
        Your account will be created immediately. Your arcade listing goes live after a quick review — usually within 1–3 business days.
      </div>

      <Field label="Arcade name" error={arcadeErrors.arcade_name} required>
        <input type="text" value={arcadeFields.arcade_name}
          onChange={(e) => setA('arcade_name', e.target.value)}
          placeholder="e.g. Level Up Arcade" className={inputClass(!!arcadeErrors.arcade_name)} />
      </Field>

      <Field label="City" hint="Select your city — this helps players find you on the map." error={arcadeErrors.city} required>
        <CitySearch
          value={arcadeFields.city}
          onChange={(name, lat, lng) => {
            setArcadeFields((f) => ({ ...f, city: name, city_lat: lat, city_lng: lng }));
            if (arcadeErrors.city) setArcadeErrors((e) => ({ ...e, city: undefined }));
          }}
          hasError={!!arcadeErrors.city}
        />
      </Field>

      <Field label="Street address" hint="Shop number, mall, or street — optional.">
        <input type="text" value={arcadeFields.address}
          onChange={(e) => setA('address', e.target.value)}
          placeholder="e.g. Shop 12, Eastgate Mall, Bedfordview"
          className={inputClass(false)} />
      </Field>

      {/* Games */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-zinc-300">
            Games supported <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-zinc-600">Select from the list and/or add your own.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_GAMES.map((game) => {
            const selected = arcadeFields.games.includes(game);
            return (
              <button key={game} type="button" onClick={() => togglePresetGame(game)}
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

        {/* Custom games added */}
        {customGames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customGames.map((g) => (
              <span key={g}
                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-xs text-zinc-300">
                {g}
                <button type="button" onClick={() => removeGame(g)}
                  className="text-zinc-500 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add custom game input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customGameInput}
            onChange={(e) => setCustomGameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomGame(); } }}
            placeholder="Add another game…"
            className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="button"
            onClick={addCustomGame}
            disabled={!customGameInput.trim()}
            className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {arcadeErrors.games && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />{arcadeErrors.games}
          </p>
        )}
      </div>

      <Field label="About your arcade">
        <textarea value={arcadeFields.description}
          onChange={(e) => setA('description', e.target.value)}
          rows={3} placeholder="Setups, events, vibe — tell us about your spot."
          className={`${inputClass(false)} resize-none`} />
      </Field>

      <Field label="Console setup" hint="e.g. 4× PS5, 2× Xbox Series X, 60-inch monitors">
        <input type="text" value={arcadeFields.console_setup}
          onChange={(e) => setA('console_setup', e.target.value)}
          placeholder="4× PS5, 60-inch screens…" className={inputClass(false)} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Contact email" error={arcadeErrors.contact_email} required>
          <input type="email" value={arcadeFields.contact_email}
            onChange={(e) => setA('contact_email', e.target.value)}
            placeholder="arcade@example.com" className={inputClass(!!arcadeErrors.contact_email)} />
        </Field>
        <Field label="Arcade contact WhatsApp" hint="Public number players can reach you on.">
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
