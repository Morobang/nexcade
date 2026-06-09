'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Loader2, AlertCircle, ArrowLeft, Settings, Upload,
  CheckCircle2, ImageIcon, Building2, Phone, Mail,
  Gamepad2, Monitor, Info,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ArcadeForm = {
  name: string;
  city: string;
  address: string;
  description: string;
  contact_email: string;
  whatsapp_number: string;
  console_setup: string;
  games_supported: string[];
  logo_url: string;
  cover_url: string;
  is_active: boolean;
};

type Arcade = ArcadeForm & { id: string; slug: string };

// ── Constants ──────────────────────────────────────────────────────────────────

const GAME_OPTIONS = [
  { id: 'FC26',    label: 'Final Combat 26',                  color: 'text-orange-400' },
  { id: 'Tekken8', label: 'Tekken 8',                         color: 'text-blue-400'   },
  { id: 'SF6',     label: 'Street Fighter 6',                 color: 'text-yellow-400' },
  { id: 'MK1',     label: 'Mortal Kombat 1',                  color: 'text-pink-400'   },
  { id: 'KOFXV',   label: 'King of Fighters XV',              color: 'text-yellow-300' },
  { id: 'Naruto',  label: 'Naruto Shippuden Ultimate Ninja Storm', color: 'text-green-400' },
];

const SA_CITIES = [
  'Johannesburg', 'Cape Town', 'Pretoria', 'Durban', 'Bloemfontein',
  'Port Elizabeth', 'Polokwane', 'East London', 'Pietermaritzburg', 'Vereeniging',
];

const BUCKET = 'arcade-assets';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function uploadFile(arcadeId: string, file: File, type: 'logo' | 'cover'): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${type}s/${arcadeId}.${ext}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error || !data) return null;
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl;
}

// ── Image upload widget ────────────────────────────────────────────────────────

function ImageUpload({
  label,
  currentUrl,
  previewFile,
  onFileChange,
  aspect,
}: {
  label: string;
  currentUrl: string;
  previewFile: File | null;
  onFileChange: (file: File) => void;
  aspect: 'square' | 'wide';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = previewFile ? URL.createObjectURL(previewFile) : currentUrl;

  return (
    <div>
      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer group bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl overflow-hidden transition-colors ${aspect === 'wide' ? 'h-36' : 'w-24 h-24'}`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <ImageIcon className="w-6 h-6 text-zinc-600" />
            <span className="text-zinc-600 text-xs">Click to upload</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Upload className="w-5 h-5 text-white" />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const router = useRouter();
  const [arcade, setArcade] = useState<Arcade | null>(null);
  const [form, setForm] = useState<ArcadeForm | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadArcade = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('arcades')
      .select('id, slug, name, city, address, description, contact_email, whatsapp_number, logo_url, cover_url, games_supported, console_setup, is_active')
      .eq('owner_id', userId)
      .single();
    if (!data) return null;
    return data as Arcade;
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (!profile || !['arcade_owner', 'platform_admin'].includes(profile.role)) {
        setUnauthorized(true); setLoading(false); return;
      }

      const arcadeData = await loadArcade(user.id);
      if (!arcadeData) { setUnauthorized(true); setLoading(false); return; }

      setArcade(arcadeData);
      setForm({
        name: arcadeData.name,
        city: arcadeData.city,
        address: arcadeData.address ?? '',
        description: arcadeData.description ?? '',
        contact_email: arcadeData.contact_email ?? '',
        whatsapp_number: arcadeData.whatsapp_number ?? '',
        console_setup: arcadeData.console_setup ?? '',
        games_supported: arcadeData.games_supported ?? [],
        logo_url: arcadeData.logo_url ?? '',
        cover_url: arcadeData.cover_url ?? '',
        is_active: arcadeData.is_active,
      });
      setLoading(false);
    }
    init();
  }, [router, loadArcade]);

  function setField<K extends keyof ArcadeForm>(key: K, value: ArcadeForm[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    setError(null);
  }

  function toggleGame(gameId: string) {
    if (!form) return;
    const current = form.games_supported;
    const updated = current.includes(gameId)
      ? current.filter((g) => g !== gameId)
      : [...current, gameId];
    setField('games_supported', updated);
  }

  async function handleSave() {
    if (!form || !arcade) return;
    if (!form.name.trim()) return setError('Arcade name is required.');
    if (!form.city.trim()) return setError('City is required.');

    setSaving(true);
    setError(null);

    let logo_url = form.logo_url;
    let cover_url = form.cover_url;

    if (logoFile) {
      const url = await uploadFile(arcade.id, logoFile, 'logo');
      if (url) logo_url = url;
      else { setError('Logo upload failed. Check your Supabase storage bucket permissions.'); setSaving(false); return; }
    }
    if (coverFile) {
      const url = await uploadFile(arcade.id, coverFile, 'cover');
      if (url) cover_url = url;
      else { setError('Cover upload failed. Check your Supabase storage bucket permissions.'); setSaving(false); return; }
    }

    const { error: saveErr } = await supabase
      .from('arcades')
      .update({
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim() || null,
        description: form.description.trim() || null,
        contact_email: form.contact_email.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        console_setup: form.console_setup.trim() || null,
        games_supported: form.games_supported,
        logo_url: logo_url || null,
        cover_url: cover_url || null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', arcade.id);

    setSaving(false);

    if (saveErr) { setError(saveErr.message); return; }

    setLogoFile(null);
    setCoverFile(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (unauthorized || !form) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-white mb-2">ACCESS DENIED</h1>
          <p className="text-zinc-400 text-sm mb-6">This area is for arcade owners only.</p>
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to admin
        </Link>
        <span className="text-zinc-700">/</span>
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">{arcade!.name}</p>
          <h1 className="font-display text-3xl text-white leading-none">ARCADE PROFILE</h1>
        </div>
      </div>

      <div className="flex flex-col gap-6">

        {/* Media */}
        <Section icon={ImageIcon} title="Media">
          <div className="flex flex-col sm:flex-row gap-5">
            <ImageUpload
              label="Logo"
              currentUrl={form.logo_url}
              previewFile={logoFile}
              onFileChange={setLogoFile}
              aspect="square"
            />
            <div className="flex-1">
              <ImageUpload
                label="Cover Photo"
                currentUrl={form.cover_url}
                previewFile={coverFile}
                onFileChange={setCoverFile}
                aspect="wide"
              />
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-zinc-600 bg-zinc-800/50 rounded-xl px-3 py-2.5 mt-1">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Requires a public Supabase Storage bucket named <code className="text-zinc-400 font-mono">arcade-assets</code>.
          </div>
        </Section>

        {/* Basic info */}
        <Section icon={Building2} title="Basic Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Arcade Name <Req /></FieldLabel>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <FieldLabel>Public URL slug</FieldLabel>
              <div className="flex items-center bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-500 text-sm font-mono">
                /arcades/{arcade!.slug}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>City <Req /></FieldLabel>
              <select
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                className={INPUT}
              >
                <option value="">Select city…</option>
                {SA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Address</FieldLabel>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="123 Main St, Sandton"
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              placeholder="Tell players what makes your arcade special…"
              className={`${INPUT} resize-none`}
            />
          </div>
        </Section>

        {/* Contact */}
        <Section icon={Phone} title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel><Mail className="w-3.5 h-3.5 inline mr-1" />Contact Email</FieldLabel>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setField('contact_email', e.target.value)}
                placeholder="bookings@arcade.co.za"
                className={INPUT}
              />
            </div>
            <div>
              <FieldLabel><Phone className="w-3.5 h-3.5 inline mr-1" />WhatsApp Number</FieldLabel>
              <input
                type="tel"
                value={form.whatsapp_number}
                onChange={(e) => setField('whatsapp_number', e.target.value)}
                placeholder="+27 71 000 0000"
                className={INPUT}
              />
            </div>
          </div>
        </Section>

        {/* Games supported */}
        <Section icon={Gamepad2} title="Games Supported">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GAME_OPTIONS.map((g) => {
              const active = form.games_supported.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGame(g.id)}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-zinc-800 border-zinc-600'
                      : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                    active ? 'bg-red-500 border-red-500' : 'border-zinc-600'
                  }`}>
                    {active && <span className="text-white text-xs font-black leading-none">✓</span>}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${active ? g.color : 'text-zinc-500'}`}>{g.id}</p>
                    <p className="text-zinc-600 text-xs leading-none mt-0.5">{g.label.split(' ').slice(0, 2).join(' ')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Console setup */}
        <Section icon={Monitor} title="Console Setup">
          <div>
            <FieldLabel>Equipment &amp; Setup Description</FieldLabel>
            <textarea
              value={form.console_setup}
              onChange={(e) => setField('console_setup', e.target.value)}
              rows={3}
              placeholder="e.g. 4× PS5, 2× Xbox Series X, Hori Fighting Commander pads provided…"
              className={`${INPUT} resize-none`}
            />
          </div>
        </Section>

        {/* Sponsorship */}
        <Section icon={Settings} title="Sponsorship Slots">
          <div className="flex items-start gap-3 bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-500">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-zinc-600" />
            <p>
              Sponsorship slot management is handled by the NexCade platform team.
              Contact <span className="text-zinc-300">support@nexcade.co.za</span> to add sponsors to your arcade profile.
            </p>
          </div>
        </Section>

        {/* Active toggle */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Arcade Active</p>
            <p className="text-zinc-500 text-xs mt-0.5">When inactive, your arcade won't appear in search results</p>
          </div>
          <button
            type="button"
            onClick={() => setField('is_active', !form.is_active)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${form.is_active ? 'bg-red-600' : 'bg-zinc-700'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

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
            Arcade profile saved successfully!
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-colors text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

      </div>
    </div>
  );
}

// ── Small reusable layout helpers (local only) ────────────────────────────────

const INPUT = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{children}</label>;
}

function Req() {
  return <span className="text-red-400 ml-0.5">*</span>;
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-red-500" />
        <h2 className="font-bold text-white text-sm uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}
