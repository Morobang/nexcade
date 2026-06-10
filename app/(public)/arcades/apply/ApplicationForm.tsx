'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Loader2, AlertCircle, CheckCircle2, Clock,
  XCircle, Building2,
} from 'lucide-react';

const GAMES = ['FC26', 'Tekken8', 'SF6', 'MK1', 'KOFXV', 'Naruto'] as const;

const GAME_LABELS: Record<string, string> = {
  FC26: 'EA FC 26',
  Tekken8: 'Tekken 8',
  SF6: 'Street Fighter 6',
  MK1: 'Mortal Kombat 1',
  KOFXV: 'KOF XV',
  Naruto: 'Naruto Storm',
};

type AppStatus = 'pending' | 'approved' | 'rejected';

type ExistingApp = {
  status: AppStatus;
  arcade_name: string;
  created_at: string;
  rejection_reason: string | null;
};

export function ApplicationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<ExistingApp | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [fields, setFields] = useState({
    arcade_name: '',
    city: '',
    address: '',
    contact_email: '',
    whatsapp_number: '',
    description: '',
    console_setup: '',
  });
  const [games, setGames] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent('/arcades/apply')}`);
        return;
      }

      // Pre-fill contact email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'arcade_owner') {
        router.replace('/admin');
        return;
      }

      if (profile?.email) {
        setFields((f) => ({ ...f, contact_email: profile.email }));
      }

      // Check for existing application
      const { data: app } = await supabase
        .from('arcade_applications')
        .select('status, arcade_name, created_at, rejection_reason')
        .eq('profile_id', user.id)
        .single();

      if (app) setExisting(app as ExistingApp);
      setLoading(false);
    }
    init();
  }, [router]);

  function toggleGame(game: string) {
    setGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game]
    );
  }

  function set(key: keyof typeof fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fields.arcade_name.trim()) { setError('Arcade name is required.'); return; }
    if (!fields.city.trim()) { setError('City is required.'); return; }
    if (!fields.contact_email.trim()) { setError('Contact email is required.'); return; }
    if (games.length === 0) { setError('Select at least one game.'); return; }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }

    const { error: insertError } = await supabase.from('arcade_applications').insert({
      profile_id:      user.id,
      arcade_name:     fields.arcade_name.trim(),
      city:            fields.city.trim(),
      address:         fields.address.trim() || null,
      contact_email:   fields.contact_email.trim().toLowerCase(),
      whatsapp_number: fields.whatsapp_number.trim() || null,
      games_supported: games,
      description:     fields.description.trim() || null,
      console_setup:   fields.console_setup.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  // Already submitted — show status
  if (existing || submitted) {
    const status = submitted ? 'pending' : existing!.status;
    const arcadeName = submitted ? fields.arcade_name : existing!.arcade_name;
    const rejectionReason = existing?.rejection_reason;

    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        {status === 'pending' && (
          <>
            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-display text-white mb-2">APPLICATION SUBMITTED</h2>
              <p className="text-zinc-400">
                Your application for <span className="text-white font-semibold">{arcadeName}</span> is under review.
              </p>
              <p className="text-zinc-500 text-sm mt-2">
                We typically review applications within 1–3 business days.
              </p>
            </div>
          </>
        )}

        {status === 'approved' && (
          <>
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-display text-white mb-2">APPROVED</h2>
              <p className="text-zinc-400">
                <span className="text-white font-semibold">{arcadeName}</span> is now live on NexCade.
              </p>
            </div>
            <Link
              href="/admin"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
            >
              Go to Admin Panel
            </Link>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-display text-white mb-2">NOT APPROVED</h2>
              <p className="text-zinc-400">
                Your application for <span className="text-white font-semibold">{arcadeName}</span> was not approved.
              </p>
              {rejectionReason && (
                <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-400 text-left max-w-md">
                  <p className="text-zinc-300 font-semibold mb-1">Reason:</p>
                  <p>{rejectionReason}</p>
                </div>
              )}
              <p className="text-zinc-500 text-sm mt-3">
                Contact us at{' '}
                <a href="mailto:support@nexcade.co.za" className="text-red-400 hover:text-red-300">
                  support@nexcade.co.za
                </a>{' '}
                if you have questions.
              </p>
            </div>
          </>
        )}
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Arcade details */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
        <h2 className="font-bold text-white text-sm uppercase tracking-wider">Arcade Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-300">Arcade name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={fields.arcade_name}
              onChange={(e) => set('arcade_name', e.target.value)}
              placeholder="e.g. Level Up Arcade"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-300">City <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={fields.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="e.g. Johannesburg"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-300">Street address</label>
          <input
            type="text"
            value={fields.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="e.g. Shop 12, Eastgate Mall, Bedfordview"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-300">About your arcade</label>
          <textarea
            value={fields.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Tell us about your arcade — how many setups, weekly events, vibe, etc."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-300">Console setup</label>
          <input
            type="text"
            value={fields.console_setup}
            onChange={(e) => set('console_setup', e.target.value)}
            placeholder="e.g. 4× PS5, 2× Xbox Series X, 60-inch monitors"
            className={inputClass}
          />
        </div>
      </div>

      {/* Games */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="font-bold text-white text-sm uppercase tracking-wider">
          Games Supported <span className="text-red-500">*</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GAMES.map((game) => {
            const selected = games.includes(game);
            return (
              <button
                key={game}
                type="button"
                onClick={() => toggleGame(game)}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                  selected
                    ? 'bg-red-600/20 border-red-500/50 text-red-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                }`}
              >
                {GAME_LABELS[game]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
        <h2 className="font-bold text-white text-sm uppercase tracking-wider">Contact Info</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-300">Contact email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={fields.contact_email}
              onChange={(e) => set('contact_email', e.target.value)}
              placeholder="arcade@example.com"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-300">WhatsApp number</label>
            <input
              type="tel"
              value={fields.whatsapp_number}
              onChange={(e) => set('whatsapp_number', e.target.value)}
              placeholder="+27 71 234 5678"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>

      <p className="text-center text-xs text-zinc-600">
        We review every application manually. You&apos;ll hear back within 1–3 business days.
      </p>
    </form>
  );
}
