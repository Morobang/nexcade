'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArcadeCombobox } from '@/components/ArcadeCombobox';
import {
  User, Camera, Shield, Bell, Lock, Trash2, Loader2, AlertCircle,
  CheckCircle2, Upload, Globe, AtSign, Play, Phone,
  MapPin, FileText, Tag, Gamepad2, ExternalLink,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type Section = 'profile' | 'photo' | 'security' | 'notifications' | 'privacy' | 'close-account';

type Profile = {
  id: string;
  full_name: string;
  gamer_tag: string;
  email: string;
  phone: string | null;
  psn_id: string | null;
  home_arcade_id: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
};

type Arcade = { id: string; name: string; city: string };

const NAV_SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',                  icon: User    },
  { id: 'photo',         label: 'Photo',                    icon: Camera  },
  { id: 'security',      label: 'Account Security',         icon: Shield  },
  { id: 'notifications', label: 'Notification Preferences', icon: Bell    },
  { id: 'privacy',       label: 'Privacy',                  icon: Lock    },
  { id: 'close-account', label: 'Close account',            icon: Trash2  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') as Section | null;
  const [section, setSection] = useState<Section>(
    sectionParam && NAV_SECTIONS.some((s) => s.id === sectionParam) ? sectionParam : 'profile'
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [arcades, setArcades] = useState<Arcade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, gamer_tag, email, phone, psn_id, home_arcade_id, avatar_url, bio, website_url, twitter_handle, instagram_handle, tiktok_handle, youtube_handle')
          .eq('id', user.id).single(),
        supabase.from('arcades').select('id, name, city').eq('is_active', true).order('city').order('name'),
      ]);
      setProfile(p as Profile | null);
      setArcades(a ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }
  if (!profile) return null;

  const initials = profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Left sidebar ── */}
        <aside className="lg:w-56 shrink-0">

          {/* Avatar + name */}
          <div className="flex lg:flex-col items-center lg:text-center gap-4 mb-6 pb-6 border-b border-zinc-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden">
              {profile.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-black text-xl">{initials}</span>}
            </div>
            <div>
              <p className="font-bold text-zinc-100 text-sm">{profile.full_name}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5">
            <Link
              href={`/profile/${profile.id}`}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              View public profile
            </Link>
            <div className="h-px bg-zinc-800 my-1" />
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors w-full ${
                  section === id
                    ? 'bg-zinc-800 text-white'
                    : id === 'close-account'
                    ? 'text-red-400 hover:bg-zinc-900 hover:text-red-300'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Right content ── */}
        <main className="flex-1 min-w-0">
          {section === 'profile'       && <ProfileSection profile={profile} arcades={arcades} onSaved={setProfile} />}
          {section === 'photo'         && <PhotoSection   profile={profile} onSaved={setProfile} />}
          {section === 'security'      && <SecuritySection email={profile.email} />}
          {section === 'notifications' && <PlaceholderSection title="Notification Preferences" />}
          {section === 'privacy'       && <PlaceholderSection title="Privacy" />}
          {section === 'close-account' && <CloseAccountSection gamerTag={profile.gamer_tag} />}
        </main>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors';

function SaveBar({ saving, success, error, onSubmit }: {
  saving: boolean; success: boolean; error: string; onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="contents">
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700/50 rounded-xl text-sm text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Saved successfully.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
        </div>
      )}
    </form>
  );
}

function SField({ label, hint, icon: Icon, children }: {
  label: string; hint?: string; icon?: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-zinc-500" />}
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-zinc-800">
      <h1 className="text-xl font-bold text-zinc-100">{title}</h1>
      {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Profile section ───────────────────────────────────────────────────────────

function ProfileSection({ profile, arcades, onSaved }: {
  profile: Profile; arcades: Arcade[]; onSaved: (p: Profile) => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [gamerTag, setGamerTag] = useState(profile.gamer_tag);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [psnId, setPsnId] = useState(profile.psn_id ?? '');
  const [homeArcadeId, setHomeArcadeId] = useState(profile.home_arcade_id ?? '');
  const [website, setWebsite] = useState(profile.website_url ?? '');
  const [twitter, setTwitter] = useState(profile.twitter_handle ?? '');
  const [instagram, setInstagram] = useState(profile.instagram_handle ?? '');
  const [tiktok, setTiktok] = useState(profile.tiktok_handle ?? '');
  const [youtube, setYoutube] = useState(profile.youtube_handle ?? '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(gamerTag.trim())) {
      setError('Gamer tag must be 3–20 characters: letters, numbers, underscores only.'); return;
    }
    setSaving(true);
    const { error: err } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      gamer_tag: gamerTag.trim(),
      bio: bio.trim() || null,
      phone: phone.trim() || null,
      psn_id: psnId.trim() || null,
      home_arcade_id: homeArcadeId || null,
      website_url: website.trim() || null,
      twitter_handle: twitter.trim() || null,
      instagram_handle: instagram.trim() || null,
      tiktok_handle: tiktok.trim() || null,
      youtube_handle: youtube.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);

    if (err) {
      setError(err.message.includes('gamer_tag') ? 'That gamer tag is already taken.' : err.message);
      setSaving(false); return;
    }
    onSaved({
      ...profile,
      full_name: fullName.trim(), gamer_tag: gamerTag.trim(),
      bio: bio.trim() || null, phone: phone.trim() || null,
      psn_id: psnId.trim() || null, home_arcade_id: homeArcadeId || null,
      website_url: website.trim() || null, twitter_handle: twitter.trim() || null,
      instagram_handle: instagram.trim() || null, tiktok_handle: tiktok.trim() || null,
      youtube_handle: youtube.trim() || null,
    });
    setSuccess(true); setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      <SectionHeader title="Public profile" subtitle="Add information about yourself" />

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700/50 rounded-xl text-sm text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Profile saved.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
        </div>
      )}

      {/* Basics */}
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Basics</h2>
        <div className="flex flex-col gap-4">
          <SField label="Full name" icon={User}>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Your full name" />
          </SField>
          <SField label="Gamer tag" icon={Tag} hint="3–20 characters. Letters, numbers and underscores only.">
            <input type="text" value={gamerTag} onChange={(e) => setGamerTag(e.target.value)} className={inputClass} placeholder="YourTag" />
          </SField>
          <SField label="Bio" icon={FileText} hint={`${bio.length}/200 characters`}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Tell the community a bit about yourself..."
            />
          </SField>
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Gaming */}
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Gaming</h2>
        <div className="flex flex-col gap-4">
          <SField label="PSN ID" icon={Gamepad2} hint="Your PlayStation Network username">
            <input type="text" value={psnId} onChange={(e) => setPsnId(e.target.value)} className={inputClass} placeholder="YourPSN" />
          </SField>
          <SField label="WhatsApp number" icon={Phone}>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+27 71 234 5678" />
          </SField>
          <SField label="Home arcade" icon={MapPin}>
            <ArcadeCombobox arcades={arcades} value={homeArcadeId} onChange={setHomeArcadeId} />
          </SField>
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Social links */}
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Links</h2>
        <div className="flex flex-col gap-4">
          <SField label="Website" icon={Globe}>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://yoursite.com" />
          </SField>
          <SField label="X (Twitter) username" icon={AtSign}>
            <div className="flex">
              <span className="px-3 py-2.5 bg-zinc-700 border border-r-0 border-zinc-600 rounded-l-xl text-zinc-500 text-sm">x.com/</span>
              <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} className={`${inputClass} rounded-l-none`} placeholder="yourhandle" />
            </div>
          </SField>
          <SField label="Instagram username" icon={AtSign}>
            <div className="flex">
              <span className="px-3 py-2.5 bg-zinc-700 border border-r-0 border-zinc-600 rounded-l-xl text-zinc-500 text-sm">instagram.com/</span>
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className={`${inputClass} rounded-l-none`} placeholder="yourhandle" />
            </div>
          </SField>
          <SField label="TikTok username" icon={AtSign}>
            <div className="flex">
              <span className="px-3 py-2.5 bg-zinc-700 border border-r-0 border-zinc-600 rounded-l-xl text-zinc-500 text-sm">tiktok.com/</span>
              <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} className={`${inputClass} rounded-l-none`} placeholder="@yourhandle" />
            </div>
          </SField>
          <SField label="YouTube channel" icon={Play}>
            <div className="flex">
              <span className="px-3 py-2.5 bg-zinc-700 border border-r-0 border-zinc-600 rounded-l-xl text-zinc-500 text-sm">youtube.com/</span>
              <input type="text" value={youtube} onChange={(e) => setYoutube(e.target.value)} className={`${inputClass} rounded-l-none`} placeholder="@yourchannel" />
            </div>
          </SField>
        </div>
      </div>

      <div>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

// ── Photo section ─────────────────────────────────────────────────────────────

function PhotoSection({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(profile.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2 MB.'); return; }
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  }

  async function handleSave() {
    if (!avatarFile) return;
    setSaving(true); setError(''); setSuccess(false);
    const ext = avatarFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${profile.id}.${ext}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
    if (uploadErr || !uploadData) {
      setError('Upload failed. Make sure the "avatars" storage bucket exists.'); setSaving(false); return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
    onSaved({ ...profile, avatar_url: publicUrl });
    setAvatarFile(null); setSuccess(true); setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Add / change photo" subtitle="JPG, PNG or WebP · max 2 MB" />

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700/50 rounded-xl text-sm text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Photo updated.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start gap-8">
        {/* Avatar preview */}
        <div className="shrink-0">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center overflow-hidden ring-4 ring-zinc-800">
            {preview
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={preview} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-black text-4xl">{initials}</span>}
          </div>
        </div>

        {/* Upload controls */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white text-sm font-semibold transition-colors"
          >
            <Upload className="w-4 h-4" />
            {avatarFile ? 'Change photo' : 'Upload photo'}
          </button>
          {avatarFile && (
            <p className="text-xs text-zinc-500">{avatarFile.name}</p>
          )}
          {avatarFile && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save photo'}
            </button>
          )}
          <p className="text-xs text-zinc-600">Minimum 200×200px recommended. Square photos work best.</p>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Security section ──────────────────────────────────────────────────────────

function SecuritySection({ email }: { email: string }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (newPw.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPw });
    if (err) { setError(err.message); setSaving(false); return; }
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setSuccess(true); setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      <SectionHeader title="Account Security" />

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700/50 rounded-xl text-sm text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Password updated.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
        </div>
      )}

      <div className="flex flex-col gap-5">
        <SField label="Email address">
          <input type="email" value={email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
          <p className="text-xs text-zinc-600 -mt-1">Email cannot be changed here.</p>
        </SField>

        <div className="h-px bg-zinc-800" />
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Change password</h2>

        <SField label="New password">
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputClass} placeholder="Min. 8 characters" />
        </SField>
        <SField label="Confirm new password">
          <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputClass} placeholder="Repeat new password" />
        </SField>
      </div>

      <div>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </div>
    </form>
  );
}

// ── Close account section ─────────────────────────────────────────────────────

function CloseAccountSection({ gamerTag }: { gamerTag: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== gamerTag) { setError(`Type your gamer tag exactly: ${gamerTag}`); return; }
    setDeleting(true);
    await supabase.auth.signOut();
    router.replace('/');
  }

  return (
    <form onSubmit={handleDelete} className="flex flex-col gap-6">
      <SectionHeader title="Close account" subtitle="This action is permanent and cannot be undone." />

      <div className="p-5 bg-red-950/40 border border-red-900/50 rounded-xl flex flex-col gap-3">
        <p className="text-sm text-red-300">
          Closing your account will permanently delete your profile, registrations, and all associated data.
          Tournament results you have appear in will remain for record-keeping.
        </p>
        <SField label={`Type your gamer tag to confirm: ${gamerTag}`}>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            placeholder={gamerTag}
          />
        </SField>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </p>
        )}
        <button
          type="submit"
          disabled={deleting || confirm !== gamerTag}
          className="self-start px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center gap-2"
        >
          {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
          {deleting ? 'Closing account…' : 'Close my account'}
        </button>
      </div>
    </form>
  );
}

// ── Placeholder ───────────────────────────────────────────────────────────────

function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title={title} />
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
        <p className="text-zinc-500 text-sm">This section is coming soon.</p>
      </div>
    </div>
  );
}
