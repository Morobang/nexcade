'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Loader2, PlusCircle, AlertCircle, CheckCircle2, Tv, Check,
} from 'lucide-react';

type FormState = {
  name: string;
  game_type: string;
  format: string;
  team_format: 'solo' | 'duo';
  max_players: string;
  entry_fee: string;
  prize_pool: string;
  start_date: string;
  start_time: string;
  deadline_date: string;
  deadline_time: string;
  venue: string;
  description: string;
  rules: string;
  is_qualifier: boolean;
  is_streamed: boolean;
  stream_url: string;
};

const INITIAL: FormState = {
  name: '',
  game_type: '',
  format: '',
  team_format: 'solo',
  max_players: '16',
  entry_fee: '',
  prize_pool: '',
  start_date: '',
  start_time: '10:00',
  deadline_date: '',
  deadline_time: '23:59',
  venue: '',
  description: '',
  rules: '',
  is_qualifier: false,
  is_streamed: false,
  stream_url: '',
};

const GAMES = [
  { id: 'FC26',    label: 'FC26',    color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  { id: 'Tekken8', label: 'Tekken8', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30'       },
  { id: 'SF6',     label: 'SF6',     color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  { id: 'MK1',     label: 'MK1',     color: 'text-pink-400 bg-pink-400/10 border-pink-400/30'       },
  { id: 'KOFXV',   label: 'KOFXV',   color: 'text-yellow-300 bg-yellow-300/10 border-yellow-300/30' },
  { id: 'Naruto',  label: 'Naruto',  color: 'text-green-400 bg-green-400/10 border-green-400/30'    },
];

const FORMATS = [
  { id: 'knockout', name: 'Single Elimination', desc: 'Lose once and you\'re out' },
  { id: 'group_ko', name: 'Group + Knockout',   desc: 'Groups then bracket'        },
  { id: 'league',   name: 'League (Round Robin)', desc: 'Everyone plays everyone'  },
];

const MAX_PLAYERS = [4, 8, 12, 16, 24, 32];

function toSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export function CreateTournamentForm({
  arcadeId,
  onCreated,
}: {
  arcadeId: string;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim())    return setError('Tournament name is required.');
    if (!form.game_type)      return setError('Please select a game.');
    if (!form.format)         return setError('Please select a format.');
    if (!form.start_date || !form.start_time) return setError('Start date and time are required.');

    const start_at = new Date(`${form.start_date}T${form.start_time}`).toISOString();
    const registration_deadline = form.deadline_date
      ? new Date(`${form.deadline_date}T${form.deadline_time || '23:59'}`).toISOString()
      : null;

    let description = form.description.trim();
    if (form.game_type === 'FC26') {
      const teamNote = form.team_format === 'duo' ? '2v2 Duo format.' : '1v1 Solo format.';
      description = description ? `${teamNote}\n\n${description}` : teamNote;
    }

    setSubmitting(true);
    const { error: err } = await supabase.from('tournaments').insert({
      arcade_id: arcadeId,
      name: form.name.trim(),
      slug: toSlug(form.name.trim()),
      game_type: form.game_type,
      format: form.format,
      status: 'open',
      max_players: parseInt(form.max_players),
      entry_fee: parseFloat(form.entry_fee) || 0,
      prize_pool: parseFloat(form.prize_pool) || 0,
      start_at,
      registration_deadline: registration_deadline ?? undefined,
      venue: form.venue.trim() || null,
      description: description || null,
      rules: form.rules.trim() || null,
      is_qualifier: form.is_qualifier,
      is_streamed: form.is_streamed,
      stream_url: form.stream_url.trim() || null,
    });
    setSubmitting(false);

    if (err) { setError(err.message); return; }

    setSuccess(true);
    setForm(INITIAL);
    setTimeout(() => setSuccess(false), 4000);
    onCreated();
  }

  const isFC26 = form.game_type === 'FC26';

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
        <PlusCircle className="w-5 h-5 text-red-500" />
        <h2 className="font-bold text-white text-sm uppercase tracking-wider">Create New Tournament</h2>
      </div>

      <div className="p-6 flex flex-col gap-7">

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Tournament Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Friday Night FC26 Showdown"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
          />
        </div>

        {/* Game selector */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Game <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => set('game_type', g.id)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  form.game_type === g.id ? g.color : 'text-zinc-500 bg-zinc-800 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* FC26 team format */}
        {isFC26 && (
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              FC26 Team Format
            </label>
            <div className="flex gap-3">
              {(['solo', 'duo'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('team_format', type)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                    form.team_format === type
                      ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                      : 'text-zinc-500 bg-zinc-800 border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {type === 'solo' ? '1v1 Solo' : '2v2 Duo'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Format */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Format <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => set('format', f.id)}
                className={`px-4 py-3 rounded-xl text-left border transition-all ${
                  form.format === f.id
                    ? 'text-red-400 bg-red-500/10 border-red-500/30'
                    : 'text-zinc-500 bg-zinc-800 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <span className="block text-xs font-bold">{f.name}</span>
                <span className="block text-zinc-600 text-xs font-normal mt-0.5">{f.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Capacity + Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Max Players
            </label>
            <select
              value={form.max_players}
              onChange={(e) => set('max_players', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors text-sm"
            >
              {MAX_PLAYERS.map((n) => (
                <option key={n} value={n}>{n} players</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Entry Fee (ZAR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">R</span>
              <input
                type="number"
                min="0"
                step="5"
                value={form.entry_fee}
                onChange={(e) => set('entry_fee', e.target.value)}
                placeholder="50"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Prize Pool (ZAR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">R</span>
              <input
                type="number"
                min="0"
                step="50"
                value={form.prize_pool}
                onChange={(e) => set('prize_pool', e.target.value)}
                placeholder="500"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Start Date &amp; Time <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => set('start_time', e.target.value)}
                className="w-28 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Registration Deadline
              <span className="text-zinc-600 font-normal normal-case ml-1">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={form.deadline_date}
                onChange={(e) => set('deadline_date', e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
              <input
                type="time"
                value={form.deadline_time}
                onChange={(e) => set('deadline_time', e.target.value)}
                className="w-28 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* Venue */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Venue / Location Notes
            <span className="text-zinc-600 font-normal normal-case ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={form.venue}
            onChange={(e) => set('venue', e.target.value)}
            placeholder="e.g. Main floor, Station 3 — bring your own controller"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
          />
        </div>

        {/* Description + Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Description
              <span className="text-zinc-600 font-normal normal-case ml-1">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
              placeholder="Brief description shown on the tournament page..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Rules
              <span className="text-zinc-600 font-normal normal-case ml-1">(optional)</span>
            </label>
            <textarea
              value={form.rules}
              onChange={(e) => set('rules', e.target.value)}
              rows={4}
              placeholder="e.g. No infinites. Double elimination in top 8. No DLC characters..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm resize-none"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => set('is_qualifier', !form.is_qualifier)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all flex-1 ${
              form.is_qualifier
                ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                : 'text-zinc-500 bg-zinc-800 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
              form.is_qualifier ? 'bg-purple-500 border-purple-500' : 'border-zinc-600'
            }`}>
              {form.is_qualifier && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm font-semibold">Qualifier Tournament</span>
          </button>

          <button
            type="button"
            onClick={() => set('is_streamed', !form.is_streamed)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all flex-1 ${
              form.is_streamed
                ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                : 'text-zinc-500 bg-zinc-800 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <Tv className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold">Streamed Tournament</span>
          </button>
        </div>

        {/* Stream URL */}
        {form.is_streamed && (
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Stream URL
            </label>
            <input
              type="url"
              value={form.stream_url}
              onChange={(e) => set('stream_url', e.target.value)}
              placeholder="https://youtube.com/live/..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
            />
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Tournament created successfully!
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-colors text-sm"
        >
          {submitting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <PlusCircle className="w-4 h-4" />}
          {submitting ? 'Creating...' : 'Create Tournament'}
        </button>

      </div>
    </form>
  );
}
