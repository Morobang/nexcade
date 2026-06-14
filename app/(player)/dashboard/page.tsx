'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { getCurrentSeasonName } from '@/lib/points';
import {
  Trophy, Loader2, Gamepad2, Gift, ChevronRight,
  MapPin, Calendar, QrCode, ExternalLink, X,
  Settings, User, Building2, Banknote, Check,
  Clock, Swords,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  full_name: string;
  gamer_tag: string;
  avatar_url: string | null;
  home_arcade_id: string | null;
};

type HomeArcade = { name: string; city: string } | null;

type TournamentRef = {
  id: string; name: string; slug: string; game_type: string;
  format: string | null; status: string; start_at: string;
  entry_fee: number; prize_pool: number | null;
  arcades: { name: string; city: string } | null;
};

type Registration = {
  id: string;
  registration_status: string;
  payment_status: string;
  booking_ref: string;
  registered_at: string;
  character_1: string | null;
  character_2: string | null;
  character_3: string | null;
  team_name: string | null;
  tournaments: TournamentRef | null;
};

type Result = {
  id: string;
  placement: number;
  is_winner: boolean;
  points_awarded: number;
  tournament_id: string;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const GAME_COLOR: Record<string, string> = {
  FC26: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Tekken8: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  SF6: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  MK1: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  KOFXV: 'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
  Naruto: 'text-green-400 bg-green-400/10 border-green-400/20',
};

const GAME_TEXT: Record<string, string> = {
  FC26: 'text-orange-400', Tekken8: 'text-blue-400', SF6: 'text-yellow-400',
  MK1: 'text-pink-400', KOFXV: 'text-yellow-300', Naruto: 'text-green-400',
};

const STATUS_PILL: Record<string, string> = {
  open:      'text-green-400 bg-green-400/10 border-green-400/20',
  full:      'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  live:      'text-red-400 bg-red-400/10 border-red-400/20',
  completed: 'text-fg-3 bg-elevated border-stroke',
  cancelled: 'text-fg-3 bg-elevated border-stroke',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function eventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' · '
    + d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatCharacter(reg: Registration): string | null {
  if (reg.team_name) return reg.team_name;
  return reg.character_1 ?? null;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function DashboardInner() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [homeArcade, setHomeArcade] = useState<HomeArcade>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [totalSeasonPts, setTotalSeasonPts] = useState(0);
  const [gameBreakdown, setGameBreakdown] = useState<{ game: string; pts: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const season = getCurrentSeasonName();

      const [
        { data: profileData },
        { data: regData },
        { data: resultData },
        { data: seasonData },
      ] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, gamer_tag, avatar_url, home_arcade_id')
          .eq('id', user.id).single(),
        supabase.from('registrations')
          .select(`
            id, registration_status, payment_status, booking_ref, registered_at,
            character_1, character_2, character_3, team_name,
            tournaments(id, name, slug, game_type, format, status, start_at, entry_fee, prize_pool,
              arcades(name, city))
          `)
          .eq('profile_id', user.id)
          .neq('registration_status', 'cancelled')
          .order('registered_at', { ascending: false }),
        supabase.from('results')
          .select('id, placement, is_winner, points_awarded, tournament_id')
          .eq('profile_id', user.id),
        supabase.from('season_points')
          .select('points, tournaments(game_type)')
          .eq('profile_id', user.id)
          .eq('season', season),
      ]);

      setProfile(profileData as Profile | null);
      setRegistrations((regData ?? []) as unknown as Registration[]);
      setResults((resultData ?? []) as unknown as Result[]);

      // Season points aggregation
      let total = 0;
      const gMap = new Map<string, number>();
      for (const sp of seasonData ?? []) {
        const pts = Number(sp.points ?? 0);
        total += pts;
        const gt = (sp as any).tournaments?.game_type as string | undefined;
        if (gt) gMap.set(gt, (gMap.get(gt) ?? 0) + pts);
      }
      setTotalSeasonPts(total);
      setGameBreakdown(Array.from(gMap.entries()).map(([game, pts]) => ({ game, pts })).sort((a, b) => b.pts - a.pts));

      // Home arcade
      if (profileData?.home_arcade_id) {
        const { data: arcadeData } = await supabase
          .from('arcades').select('name, city')
          .eq('id', profileData.home_arcade_id).single();
        setHomeArcade(arcadeData);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 text-fg-3 animate-spin" />
      </div>
    );
  }
  if (!profile) return null;

  // Derived values
  const initials = profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const totalEntered = registrations.length;
  const wins = results.filter((r) => r.is_winner).length;
  const winRate = results.length > 0 ? Math.round((wins / results.length) * 100) : 0;
  const paidCount = registrations.filter((r) => r.payment_status === 'paid').length;
  const loyaltyStep = paidCount % 3;
  const freeEarned = Math.floor(paidCount / 3);

  const upcoming = registrations
    .filter((r) => r.tournaments && ['open', 'live', 'full'].includes(r.tournaments.status))
    .sort((a, b) => new Date(a.tournaments!.start_at).getTime() - new Date(b.tournaments!.start_at).getTime());

  const past = registrations
    .filter((r) => r.tournaments && ['completed', 'cancelled'].includes(r.tournaments.status));

  const nextEvent = upcoming[0] ?? null;
  const resultMap = new Map(results.map((r) => [r.tournament_id, r]));

  const allShown = [...upcoming.slice(0, 2), ...past.slice(0, 2)];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">

      {/* ── Profile header ── */}
      <div className="bg-surface border border-stroke rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-red-600/20">
            {profile.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-black text-base">{initials}</span>}
          </div>
          <div>
            <p className="text-fg font-semibold text-lg leading-none tracking-wide">{profile.gamer_tag}</p>
            <p className="text-fg-3 text-xs mt-1">
              {profile.full_name}
              {homeArcade ? ` · ${homeArcade.name}, ${homeArcade.city}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {totalSeasonPts > 0 && (
            <span className="text-xs bg-elevated border border-stroke rounded-lg px-2.5 py-1 text-fg-2">
              {totalSeasonPts} pts
            </span>
          )}
          {gameBreakdown[0] && (
            <span className={`text-xs bg-elevated border border-stroke rounded-lg px-2.5 py-1 ${GAME_TEXT[gameBreakdown[0].game] ?? 'text-fg-2'}`}>
              {gameBreakdown[0].game}
            </span>
          )}
          <Link
            href={`/profile/${profile.id}`}
            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            View profile <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Gamepad2, label: 'Tournaments', value: totalEntered },
          { icon: Trophy,   label: 'Wins',        value: wins         },
          { icon: Swords,   label: 'Win rate',    value: `${winRate}%` },
          { icon: Gift,     label: 'Season pts',  value: totalSeasonPts },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-elevated border border-stroke rounded-xl p-4">
            <Icon className="w-4.5 h-4.5 text-fg-3 mb-2" style={{ width: 18, height: 18 }} />
            <p className="text-2xl font-semibold text-fg">{value}</p>
            <p className="text-xs text-fg-3 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Next event ── */}
      {nextEvent && (() => {
        const t = nextEvent.tournaments!;
        const arcade = t.arcades as { name: string; city: string } | null;
        const char = formatCharacter(nextEvent);
        const status = STATUS_PILL[t.status];
        const game = GAME_COLOR[t.game_type];
        return (
          <div className="bg-surface border border-stroke rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-fg-3 uppercase tracking-widest mb-3">Your next event</p>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-48">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {game && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${game}`}>
                      {t.game_type}
                    </span>
                  )}
                  {status && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-md border capitalize ${status}`}>
                      {t.status}
                    </span>
                  )}
                </div>
                <p className="text-fg font-semibold text-base mb-1">{t.name}</p>
                {arcade && (
                  <p className="text-fg-3 text-sm flex items-center gap-1.5 mb-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {arcade.name}, {arcade.city}
                  </p>
                )}
                {t.start_at && (
                  <p className="text-fg-3 text-sm flex items-center gap-1.5 mb-3">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {eventDate(t.start_at)}
                  </p>
                )}
                <div className="flex gap-4 flex-wrap">
                  {t.format && (
                    <div>
                      <p className="text-[11px] text-fg-3">Format</p>
                      <p className="text-sm font-semibold text-fg capitalize">{t.format}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] text-fg-3">Entry</p>
                    <p className="text-sm font-semibold text-fg">
                      {t.entry_fee === 0 ? 'Free' : formatCurrency(Number(t.entry_fee))}
                    </p>
                  </div>
                  {t.prize_pool != null && Number(t.prize_pool) > 0 && (
                    <div>
                      <p className="text-[11px] text-fg-3">Prize</p>
                      <p className="text-sm font-semibold text-fg">{formatCurrency(Number(t.prize_pool))}</p>
                    </div>
                  )}
                  {char && (
                    <div>
                      <p className="text-[11px] text-fg-3">Character</p>
                      <p className="text-sm font-semibold text-fg">{char}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end shrink-0">
                <p className="text-[11px] text-fg-3">Ref: {nextEvent.booking_ref}</p>
                <button
                  onClick={() => setQrOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-elevated hover:bg-stroke border border-stroke text-fg-2 hover:text-fg text-xs font-semibold transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" /> View QR
                </button>
                <Link
                  href={`/tournaments/${t.slug ?? t.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-elevated hover:bg-stroke border border-stroke text-fg-2 hover:text-fg text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Tournament page
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Swords,    label: 'Browse',    href: '/tournaments'       },
          { icon: QrCode,    label: 'My QR',     onClick: () => setQrOpen(true) },
          { icon: User,      label: 'Profile',   href: `/profile/${profile.id}` },
          { icon: Settings,  label: 'Settings',  href: '/settings'          },
        ].map(({ icon: Icon, label, href, onClick }) =>
          href ? (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl bg-elevated border border-stroke text-fg-3 hover:text-fg hover:border-zinc-600 transition-all text-xs font-semibold"
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ) : (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl bg-elevated border border-stroke text-fg-3 hover:text-fg hover:border-zinc-600 transition-all text-xs font-semibold"
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          )
        )}
      </div>

      {/* ── Loyalty + Season ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Loyalty */}
        <div className="bg-surface border border-stroke rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-fg-3 uppercase tracking-widest mb-3">Loyalty rewards</p>
          <div className="flex items-center mb-3">
            {[0, 1, 2].map((i) => {
              const done = i < loyaltyStep;
              const isGift = i === 2;
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    done ? 'bg-red-600' : 'bg-elevated border border-stroke'
                  }`}>
                    {done
                      ? <Check className="w-3.5 h-3.5 text-white" />
                      : isGift
                      ? <Gift className="w-3.5 h-3.5 text-fg-3" />
                      : <span className="w-2 h-2 rounded-full bg-stroke block" />}
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-0.5 mx-0.5 transition-colors ${i < loyaltyStep - 1 ? 'bg-red-600' : 'bg-stroke'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-fg-3">
            {loyaltyStep}/3 —{' '}
            {loyaltyStep < 3
              ? `${3 - loyaltyStep} more paid ${3 - loyaltyStep === 1 ? 'entry' : 'entries'} for a free tournament`
              : "You've earned a free entry!"}
          </p>
          {freeEarned > 0 && (
            <p className="text-xs text-fg-3 mt-1">
              {freeEarned} free {freeEarned === 1 ? 'entry' : 'entries'} earned so far
            </p>
          )}
        </div>

        {/* Season */}
        <div className="bg-surface border border-stroke rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-fg-3 uppercase tracking-widest">{getCurrentSeasonName()}</p>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-semibold text-fg">{totalSeasonPts}</span>
            <span className="text-sm text-fg-3">points</span>
          </div>
          {gameBreakdown.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {gameBreakdown.slice(0, 3).map(({ game, pts }) => (
                <div key={game} className="flex justify-between text-xs">
                  <span className={`${GAME_TEXT[game] ?? 'text-fg-2'}`}>{game}</span>
                  <span className="text-fg font-semibold">{pts} pts</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-fg-3">No season points yet — enter a tournament to start earning.</p>
          )}
        </div>
      </div>

      {/* ── My tournaments ── */}
      <div className="bg-surface border border-stroke rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-fg-3 uppercase tracking-widest">My tournaments</p>
          <Link href="/my-tournaments" className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {allShown.length === 0 ? (
          <div className="text-center py-8">
            <Gamepad2 className="w-7 h-7 text-fg-3 mx-auto mb-2" />
            <p className="text-fg-3 text-sm mb-3">No tournaments yet</p>
            <Link
              href="/tournaments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors"
            >
              Browse tournaments
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {allShown.map((reg) => {
              const t = reg.tournaments;
              if (!t) return null;
              const arcade = t.arcades as { name: string; city: string } | null;
              const result = resultMap.get(t.id);
              const char = formatCharacter(reg);
              const isPast = ['completed', 'cancelled'].includes(t.status);
              const game = GAME_COLOR[t.game_type];
              const statusPill = STATUS_PILL[t.status];
              const isPaid = reg.payment_status === 'paid';

              return (
                <div
                  key={reg.id}
                  className={`flex items-center justify-between gap-3 p-3 bg-elevated rounded-xl flex-wrap transition-opacity ${isPast ? 'opacity-60' : ''}`}
                >
                  <div className="flex-1 min-w-44">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {game && (
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${game}`}>{t.game_type}</span>
                      )}
                      {statusPill && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded border capitalize ${statusPill}`}>{t.status}</span>
                      )}
                      {!isPast && isPaid && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded border text-green-400 bg-green-400/10 border-green-400/20">Paid</span>
                      )}
                    </div>
                    <p className="text-fg font-semibold text-sm">{t.name}</p>
                    <p className="text-fg-3 text-xs mt-0.5">
                      {arcade?.name}
                      {t.start_at ? ` · ${new Date(t.start_at).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}
                      {char ? ` · ${char}` : ''}
                    </p>
                  </div>

                  {isPast && result ? (
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-black ${result.placement === 1 ? 'text-yellow-400' : result.placement === 2 ? 'text-fg-2' : 'text-orange-400'}`}>
                        {result.placement === 1 ? '1st' : result.placement === 2 ? '2nd' : result.placement === 3 ? '3rd' : `${result.placement}th`}
                      </p>
                      {result.points_awarded > 0 && (
                        <p className="text-[11px] text-fg-3">+{result.points_awarded} pts</p>
                      )}
                    </div>
                  ) : !isPast ? (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => setQrOpen(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface border border-stroke text-fg-3 hover:text-fg text-xs font-semibold transition-colors"
                      >
                        <QrCode className="w-3 h-3" /> QR
                      </button>
                      <Link
                        href={`/tournaments/${t.slug ?? t.id}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface border border-stroke text-fg-3 hover:text-fg text-xs font-semibold transition-colors"
                      >
                        <ChevronRight className="w-3 h-3" /> View
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── QR Modal ── */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="bg-surface border border-stroke rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-fg font-bold">My Check-in QR Codes</p>
              <button onClick={() => setQrOpen(false)} className="text-fg-3 hover:text-fg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {upcoming.length === 0 ? (
              <p className="text-fg-3 text-sm text-center py-6">No upcoming registrations.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {upcoming.map((reg) => {
                  const t = reg.tournaments;
                  if (!t) return null;
                  return (
                    <div key={reg.id} className="flex flex-col items-center gap-3">
                      <div className="bg-white p-3 rounded-xl">
                        <QRCode value={reg.booking_ref} size={160} />
                      </div>
                      <div className="text-center">
                        <p className="text-fg font-semibold text-sm">{t.name}</p>
                        <p className="text-fg-3 text-xs mt-0.5">
                          {t.arcades ? `${(t.arcades as any).name} · ` : ''}
                          {t.start_at ? new Date(t.start_at).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                        </p>
                        <p className="text-fg-3 text-xs font-mono mt-1.5 tracking-widest">{reg.booking_ref}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-64"><Loader2 className="w-6 h-6 text-fg-3 animate-spin" /></div>}><DashboardInner /></Suspense>;
}
