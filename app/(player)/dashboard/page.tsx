'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArcadeCombobox } from '@/components/ArcadeCombobox';
import { formatDate } from '@/lib/utils';
import {
  LayoutDashboard, Trophy, Clock, History, Settings,
  Loader2, AlertCircle, CheckCircle2, Star, Gift, Gamepad2,
  Calendar, MapPin, User, Phone, Tag, Upload, Camera,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string; full_name: string; gamer_tag: string;
  email: string; phone: string | null;
  home_arcade_id: string | null; avatar_url: string | null;
};

type TournamentRef = {
  id: string; name: string; slug: string; game_type: string;
  format: string; status: string; start_at: string;
  entry_fee: number; prize_pool: number;
  arcades: { name: string; city: string } | null;
};

type Registration = {
  id: string; registration_status: string; payment_status: string;
  booking_ref: string; registered_at: string;
  tournaments: TournamentRef | null;
};

type Result = {
  id: string; placement: number; is_winner: boolean;
  points_awarded: number; recorded_at: string;
  tournaments: {
    id: string; name: string; slug: string; game_type: string;
    status: string; start_at: string;
    arcades: { name: string; city: string } | null;
  } | null;
};

type Arcade = { id: string; name: string; city: string };
type Tab = 'overview' | 'tournaments' | 'history' | 'settings';

const GAME_COLOR: Record<string, string> = {
  FC26: 'text-orange-400', Tekken8: 'text-blue-400', SF6: 'text-yellow-400',
  MK1: 'text-pink-400', KOFXV: 'text-yellow-300', Naruto: 'text-green-400',
};

const STATUS_PILL: Record<string, string> = {
  open: 'text-green-400 bg-green-400/10 border-green-400/20',
  full: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  live: 'text-red-400 bg-red-400/10 border-red-400/20',
  completed: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  cancelled: 'text-zinc-600 bg-zinc-600/10 border-zinc-600/20',
};

// ── Page ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(tabParam && ['overview','tournaments','history','settings'].includes(tabParam) ? tabParam : 'overview');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [arcades, setArcades] = useState<Arcade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const [
        { data: profileData },
        { data: regData },
        { data: resultData },
        { data: arcadeData },
      ] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, gamer_tag, email, phone, home_arcade_id, avatar_url')
          .eq('id', user.id).single(),
        supabase.from('registrations')
          .select('id, registration_status, payment_status, booking_ref, registered_at, tournaments(id, name, slug, game_type, format, status, start_at, entry_fee, prize_pool, arcades(name, city))')
          .eq('profile_id', user.id)
          .neq('registration_status', 'cancelled')
          .order('registered_at', { ascending: false }),
        supabase.from('results')
          .select('id, placement, is_winner, points_awarded, recorded_at, tournaments(id, name, slug, game_type, status, start_at, arcades(name, city))')
          .eq('profile_id', user.id)
          .order('recorded_at', { ascending: false }),
        supabase.from('arcades')
          .select('id, name, city').eq('is_active', true).order('city').order('name'),
      ]);

      setProfile(profileData as Profile | null);
      setRegistrations((regData ?? []) as unknown as Registration[]);
      setResults((resultData ?? []) as unknown as Result[]);
      setArcades(arcadeData ?? []);
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
  const totalEntered = registrations.length;
  const paidCount = registrations.filter((r) => r.payment_status === 'paid').length;
  const wins = results.filter((r) => r.is_winner).length;
  const winRate = results.length > 0 ? Math.round((wins / results.length) * 100) : 0;
  const loyaltyProgress = paidCount % 3;
  const freeEarned = Math.floor(paidCount / 3);
  const upcoming = registrations.filter((r) => r.tournaments && ['open', 'full', 'live'].includes(r.tournaments.status));
  const pastRegs = registrations.filter((r) => r.tournaments && ['completed', 'cancelled'].includes(r.tournaments.status));

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',    label: 'Overview',       icon: LayoutDashboard },
    { id: 'tournaments', label: 'My Tournaments', icon: Trophy          },
    { id: 'history',     label: 'History',        icon: History         },
    { id: 'settings',    label: 'Settings',       icon: Settings        },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Profile header ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-red-600/20">
          {profile.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-white font-black text-xl">{initials}</span>}
        </div>
        <div>
          <h1 className="font-display text-3xl text-white leading-none">{profile.gamer_tag.toUpperCase()}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{profile.full_name}</p>
        </div>
      </div>

      {/* ── Horizontal tab bar ── */}
      <div className="flex gap-0 border-b border-stroke mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === id
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === 'overview' && (
        <OverviewTab wins={wins} totalEntered={totalEntered} winRate={winRate}
          paidCount={paidCount} loyaltyProgress={loyaltyProgress}
          freeEarned={freeEarned} upcoming={upcoming} />
      )}
      {tab === 'tournaments' && <TournamentsTab registrations={upcoming} />}
      {tab === 'history'     && <HistoryTab registrations={pastRegs} results={results} />}
      {tab === 'settings'    && <SettingsTab profile={profile} arcades={arcades} onSaved={setProfile} />}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab({ wins, totalEntered, winRate, paidCount, loyaltyProgress, freeEarned, upcoming }: {
  wins: number; totalEntered: number; winRate: number; paidCount: number;
  loyaltyProgress: number; freeEarned: number; upcoming: Registration[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">OVERVIEW</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Gamepad2, label: 'Entered',      value: totalEntered, color: 'text-blue-400'   },
          { icon: Trophy,   label: 'Wins',         value: wins,         color: 'text-yellow-400' },
          { icon: Star,     label: 'Win rate',     value: `${winRate}%`, color: 'text-red-400'  },
          { icon: Clock,    label: 'Paid entries', value: paidCount,    color: 'text-green-400'  },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Loyalty */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-red-400" />
          <h2 className="text-white font-bold text-sm">Loyalty Rewards</h2>
          {freeEarned > 0 && (
            <span className="ml-auto text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
              {freeEarned} free {freeEarned === 1 ? 'entry' : 'entries'} earned
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-xs mb-3">
          Every 3 paid entries earns 1 free entry.{' '}
          {loyaltyProgress > 0
            ? `${3 - loyaltyProgress} more paid ${3 - loyaltyProgress === 1 ? 'entry' : 'entries'} until your next free one.`
            : paidCount === 0 ? 'Start entering paid tournaments to earn rewards.'
            : 'You just earned a free entry!'}
        </p>
        <div className="flex gap-2 mb-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${i < loyaltyProgress ? 'bg-red-500' : 'bg-zinc-800'}`} />
          ))}
        </div>
        <p className="text-xs text-zinc-600">{loyaltyProgress}/3 toward next free entry</p>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="font-bold text-white text-sm uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="flex flex-col gap-3">
            {upcoming.slice(0, 3).map((r) => <RegCard key={r.id} reg={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tournaments ───────────────────────────────────────────────────────────────

function TournamentsTab({ registrations }: { registrations: Registration[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-4xl text-white">MY TOURNAMENTS</h1>
      {registrations.length === 0
        ? <EmptyState message="No active registrations" cta={{ label: 'Browse tournaments', href: '/tournaments' }} />
        : registrations.map((r) => <RegCard key={r.id} reg={r} />)}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────

function HistoryTab({ registrations, results }: { registrations: Registration[]; results: Result[] }) {
  const byTournament = new Map(results.map((r) => [r.tournaments?.id, r]));
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-4xl text-white">HISTORY</h1>
      {registrations.length === 0
        ? <EmptyState message="No past tournaments yet" />
        : registrations.map((r) => (
            <RegCard key={r.id} reg={r} result={r.tournaments ? byTournament.get(r.tournaments.id) : undefined} />
          ))}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

function SettingsTab({ profile, arcades, onSaved }: { profile: Profile; arcades: Arcade[]; onSaved: (p: Profile) => void }) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [gamerTag, setGamerTag] = useState(profile.gamer_tag);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [homeArcadeId, setHomeArcadeId] = useState(profile.home_arcade_id ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors';
  const initials = profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2 MB.'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(gamerTag.trim())) {
      setError('Gamer tag must be 3–20 characters, letters/numbers/underscores only.'); return;
    }
    setSaving(true);

    let avatar_url = profile.avatar_url;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${profile.id}.${ext}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (uploadErr || !uploadData) {
        setError('Avatar upload failed. Make sure the "avatars" storage bucket exists in Supabase.');
        setSaving(false); return;
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
      avatar_url = publicUrl;
    }

    const { error: err } = await supabase.from('profiles').update({
      full_name: fullName.trim(), gamer_tag: gamerTag.trim(),
      phone: phone.trim() || null, home_arcade_id: homeArcadeId || null,
      avatar_url,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);

    if (err) {
      setError(err.message.includes('gamer_tag') ? 'That gamer tag is already taken.' : err.message);
      setSaving(false); return;
    }
    onSaved({ ...profile, full_name: fullName.trim(), gamer_tag: gamerTag.trim(), phone: phone.trim() || null, home_arcade_id: homeArcadeId || null, avatar_url: avatar_url ?? null });
    setAvatarFile(null);
    setSuccess(true); setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">SETTINGS</h1>
      <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700/50 rounded-xl text-sm text-green-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />Profile updated successfully.
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-5 pb-5 border-b border-zinc-800">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center overflow-hidden shadow-lg shadow-red-600/20">
              {avatarPreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-black text-2xl">{initials}</span>}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-zinc-300" />
            </button>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-1">Profile picture</p>
            <p className="text-zinc-500 text-xs mb-2">JPG, PNG or WebP — max 2 MB</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {avatarFile ? 'Change photo' : 'Upload photo'}
            </button>
            {avatarFile && (
              <p className="text-xs text-zinc-500 mt-1.5">{avatarFile.name}</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SField label="Full name" icon={User}>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </SField>
          <SField label="Gamer tag" icon={Tag}>
            <input type="text" value={gamerTag} onChange={(e) => setGamerTag(e.target.value)} className={inputClass} />
          </SField>
          <SField label="WhatsApp number" icon={Phone}>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 71 234 5678" className={inputClass} />
          </SField>
          <SField label="Email" icon={User}>
            <input type="email" value={profile.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
            <p className="text-xs text-zinc-600 mt-1">Email cannot be changed here.</p>
          </SField>
        </div>
        <SField label="Home arcade" icon={MapPin}>
          <ArcadeCombobox arcades={arcades} value={homeArcadeId} onChange={setHomeArcadeId} />
        </SField>
        <button type="submit" disabled={saving}
          className="self-start px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

// ── Micro helpers ─────────────────────────────────────────────────────────────

function RegCard({ reg, result }: { reg: Registration; result?: Result }) {
  const t = reg.tournaments;
  if (!t) return null;
  const arcade = t.arcades as { name: string; city: string } | null;
  const placement = result?.placement;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${GAME_COLOR[t.game_type] ?? 'text-zinc-400'}`}>{t.game_type}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_PILL[t.status] ?? ''}`}>
            {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
          </span>
          {reg.payment_status === 'paid' && (
            <span className="text-xs px-2 py-0.5 rounded-full border font-semibold text-green-400 bg-green-400/10 border-green-400/20">Paid</span>
          )}
        </div>
        <Link href={`/tournaments/${t.slug}`} className="text-white font-bold hover:text-red-400 transition-colors text-sm">
          {t.name}
        </Link>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
          {arcade && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{arcade.name} · {arcade.city}</span>}
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(t.start_at, 'short')}</span>
          <span>Ref: {reg.booking_ref.slice(0, 8)}…</span>
        </div>
      </div>
      {placement && (
        <div className="text-right shrink-0">
          <p className={`text-lg font-black ${placement === 1 ? 'text-yellow-400' : placement === 2 ? 'text-zinc-300' : placement === 3 ? 'text-orange-400' : 'text-zinc-500'}`}>
            {placement === 1 ? '1st' : placement === 2 ? '2nd' : placement === 3 ? '3rd' : `${placement}th`}
          </p>
          {(result?.points_awarded ?? 0) > 0 && <p className="text-xs text-zinc-500">+{result!.points_awarded} pts</p>}
        </div>
      )}
    </div>
  );
}

function SField({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-zinc-500" />{label}
      </label>
      {children}
    </div>
  );
}

function EmptyState({ message, cta }: { message: string; cta?: { label: string; href: string } }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
      <p className="text-zinc-500 text-sm mb-4">{message}</p>
      {cta && <Link href={cta.href} className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">{cta.label}</Link>}
    </div>
  );
}

export default function Page() {
  return <Suspense><DashboardPage /></Suspense>;
}
