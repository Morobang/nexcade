'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, CheckCircle2, Lock, User } from 'lucide-react';

// ── Character rosters ────────────────────────────────────────────────────────

const TEKKEN8 = [
  'Alisa','Asuka','Azucena','Bob','Bryan','Claudio','Devil Jin','Dragunov',
  'Eddy','Feng','Heihachi','Hwoarang','Jack-8','Jin','Jun','King','Kuma',
  'Lars','Lee','Leo','Leroy','Lili','Ling Xiaoyu','Nina','Paul','Panda',
  'Raven','Reina','Shaheen','Steve','Victor','Yoshimitsu','Zafina',
];

const SF6 = [
  'Akuma','Aki','Blanka','Cammy','Chun-Li','Dee Jay','Dhalsim','E. Honda',
  'Ed','Guile','Jamie','JP','Juri','Ken','Kimberly','Lily','Luke','M. Bison',
  'Manon','Marisa','Rashid','Ryu','Zangief',
];

const MK1 = [
  'Ashrah','Baraka','Cyrax','Ermac','Geras','General Shao','Havik',
  'Homelander','Johnny Cage','Kenshi','Kitana','Kung Lao','Li Mei',
  'Liu Kang','Mileena','Nitara','Omni-Man','Peacemaker','Rain','Raiden',
  'Reiko','Reptile','Scorpion','Shang Tsung','Sindel','Smoke','Sub-Zero','Tanya',
];

const KOFXV = [
  'Andy','Angel','Athena','B. Jenet','Benimaru','Billy','Blue Mary',
  'Chang','Chizuru','Chin','Chris','Clark','Dolores','Goro Daimon',
  'Iori','Joe','King','Kula','Kyo','Leona','Mai','Mary','Orochi Iori',
  'Ralf','Ramon','Robert','Rock','Ryo','Shermie','Sie Kensou',
  'Terry','Vice','Yamazaki','Yuri',
];

const NARUTO_CHARS = [
  'Choji','Deidara','Gaara','Guy','Hidan','Hinata','Itachi','Jiraiya',
  'Kabuto','Kakashi','Kakuzu','Kiba','Kisame','Konan','Minato','Naruto',
  'Neji','Obito','Orochimaru','Pain','Rock Lee','Sakura','Sasuke',
  'Shikamaru','Shino','Temari','Tsunade','Yamato',
];

const ROSTERS: Record<string, string[]> = {
  Tekken8: TEKKEN8,
  SF6: SF6,
  MK1: MK1,
  KOFXV: KOFXV,
  Naruto: NARUTO_CHARS,
};

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  tournamentId: string;
  gameType: string;
  rules: string | null;
  registrationDeadline: string | null;
  maxPlayers: number;
}

type Profile = {
  id: string;
  full_name: string;
  gamer_tag: string;
  email: string;
  phone: string | null;
};

// ── Component ────────────────────────────────────────────────────────────────

export function RegistrationForm({
  tournamentId,
  gameType,
  rules,
  registrationDeadline,
  maxPlayers,
}: Props) {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [spotsFull, setSpotsFull] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Game-specific fields
  const [teamName, setTeamName] = useState('');
  const [teamType, setTeamType] = useState<'Solo' | 'Duo'>('Solo');
  const [char1, setChar1] = useState('');
  const [char2, setChar2] = useState('');
  const [char3, setChar3] = useState('');
  const [supportChar, setSupportChar] = useState('');
  const [rulesAgreed, setRulesAgreed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        localStorage.setItem('pendingTourneyId', tournamentId);
        router.replace('/login');
        return;
      }

      const [{ data: profileData }, { count: regCount }, { count: totalReg }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, gamer_tag, email, phone').eq('id', user.id).single(),
        supabase.from('registrations').select('id', { count: 'exact', head: true })
          .eq('tournament_id', tournamentId).eq('profile_id', user.id).neq('registration_status', 'cancelled'),
        supabase.from('registrations').select('id', { count: 'exact', head: true })
          .eq('tournament_id', tournamentId).neq('registration_status', 'cancelled'),
      ]);

      setProfile(profileData as Profile | null);
      setAlreadyRegistered((regCount ?? 0) > 0);
      setSpotsFull((totalReg ?? 0) >= maxPlayers);
    }
    load();
  }, [tournamentId, maxPlayers, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!rulesAgreed) {
      setError('You must agree to the tournament rules to register.');
      return;
    }

    if (gameType === 'FC26' && !teamName.trim()) {
      setError('Enter your team name.');
      return;
    }

    const roster = ROSTERS[gameType];
    if (roster) {
      if (!char1) { setError('Select your character.'); return; }
      if (gameType === 'KOFXV' && (!char2 || !char3)) {
        setError('Select all 3 characters for your KOF XV team.'); return;
      }
      if (gameType === 'Naruto' && (!char2 || !supportChar)) {
        setError('Select both characters and a support character.'); return;
      }
    }

    setSubmitting(true);

    const { data: regData, error: regError } = await supabase
      .from('registrations')
      .insert({
        tournament_id: tournamentId,
        profile_id: profile!.id,
        registration_status: 'registered',
        payment_status: 'pending',
        team_name: gameType === 'FC26' ? teamName.trim() : null,
        team_type: gameType === 'FC26' ? teamType : null,
        character_1: char1 || null,
        character_2: char2 || null,
        character_3: gameType === 'KOFXV' ? char3 : null,
        support_character: gameType === 'Naruto' ? supportChar : null,
        rules_agreed: true,
        registered_at: new Date().toISOString(),
      })
      .select('booking_ref')
      .single();

    if (regError) {
      setError(regError.message);
      setSubmitting(false);
      return;
    }

    // Non-blocking n8n webhook for WhatsApp confirmation
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_ref: regData?.booking_ref,
          gamer_tag: profile!.gamer_tag,
          phone: profile!.phone,
          tournament_id: tournamentId,
        }),
      }).catch(() => {});
    }

    router.push(`/confirmation?ref=${regData?.booking_ref}`);
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  // ── Already registered ─────────────────────────────────────────────────────

  if (alreadyRegistered) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-white mb-2">ALREADY REGISTERED</h2>
        <p className="text-zinc-400 text-sm mb-6">You are already signed up for this tournament.</p>
        <Link href="/dashboard" className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
          Go to dashboard
        </Link>
      </div>
    );
  }

  // ── Tournament full ────────────────────────────────────────────────────────

  if (spotsFull) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-white mb-2">TOURNAMENT FULL</h2>
        <p className="text-zinc-400 text-sm">All spots have been taken. Check back for future events.</p>
      </div>
    );
  }

  const roster = ROSTERS[gameType] ?? [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Player info (pre-filled, read-only) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-zinc-500" />
          <h2 className="text-white font-bold text-sm uppercase tracking-wider">Your account</h2>
          <Lock className="w-3.5 h-3.5 text-zinc-600 ml-auto" />
          <span className="text-xs text-zinc-600">Pre-filled from your profile</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500 text-xs mb-0.5">Gamer tag</p>
            <p className="text-zinc-100 font-semibold">{profile?.gamer_tag}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs mb-0.5">Full name</p>
            <p className="text-zinc-100">{profile?.full_name}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs mb-0.5">Email</p>
            <p className="text-zinc-100">{profile?.email}</p>
          </div>
          {profile?.phone && (
            <div>
              <p className="text-zinc-500 text-xs mb-0.5">WhatsApp</p>
              <p className="text-zinc-100">{profile.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Game-specific fields */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
        <h2 className="text-white font-bold text-sm uppercase tracking-wider">
          {gameType} details
        </h2>

        {/* FC26 */}
        {gameType === 'FC26' && (
          <>
            <Field label="Team name" required>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Blaze Squad"
                className={inputClass}
              />
            </Field>
            <Field label="Team type">
              <div className="flex gap-3">
                {(['Solo', 'Duo'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTeamType(t)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                      teamType === t
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* Single character (Tekken8, SF6, MK1) */}
        {['Tekken8', 'SF6', 'MK1'].includes(gameType) && (
          <Field label="Your character" required>
            <CharSelect roster={roster} value={char1} onChange={setChar1} placeholder="Select character" />
          </Field>
        )}

        {/* KOFXV — 3-man team */}
        {gameType === 'KOFXV' && (
          <>
            <Field label="Character 1" required>
              <CharSelect roster={roster} value={char1} onChange={setChar1} placeholder="Select character 1" />
            </Field>
            <Field label="Character 2" required>
              <CharSelect roster={roster} value={char2} onChange={setChar2} placeholder="Select character 2" />
            </Field>
            <Field label="Character 3" required>
              <CharSelect roster={roster} value={char3} onChange={setChar3} placeholder="Select character 3" />
            </Field>
          </>
        )}

        {/* Naruto — char 1, char 2, support */}
        {gameType === 'Naruto' && (
          <>
            <Field label="Character 1" required>
              <CharSelect roster={roster} value={char1} onChange={setChar1} placeholder="Select character 1" />
            </Field>
            <Field label="Character 2" required>
              <CharSelect roster={roster} value={char2} onChange={setChar2} placeholder="Select character 2" />
            </Field>
            <Field label="Support character" required>
              <CharSelect roster={roster} value={supportChar} onChange={setSupportChar} placeholder="Select support" />
            </Field>
          </>
        )}
      </div>

      {/* Rules */}
      {rules && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Tournament rules</h2>
          <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">{rules}</p>
        </div>
      )}

      {/* Rules agreement */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={rulesAgreed}
            onChange={(e) => setRulesAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-red-600 shrink-0"
          />
          <span className="text-sm text-zinc-400 leading-snug">
            I have read and agree to the tournament rules and NexCade&apos;s{' '}
            <Link href="/terms" className="text-red-400 hover:text-red-300 underline" target="_blank">
              Terms of Service
            </Link>.
          </span>
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {registrationDeadline && (
        <p className="text-xs text-zinc-600 text-center">
          Registration closes {new Date(registrationDeadline).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Registering…' : 'Confirm registration'}
      </button>
    </form>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors';

function Field({
  label,
  required,
  children,
}: {
  label: string;
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
    </div>
  );
}

function CharSelect({
  roster,
  value,
  onChange,
  placeholder,
}: {
  roster: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    >
      <option value="">{placeholder}</option>
      {roster.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
