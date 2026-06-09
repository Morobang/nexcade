import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate, formatCurrency } from '@/lib/utils';
import { RegistrationForm } from './RegistrationForm';

type Params = Promise<{ id: string }>;

const GAME_COLORS: Record<string, string> = {
  FC26: '#f97316',
  Tekken8: '#3b82f6',
  SF6: '#eab308',
  MK1: '#ec4899',
  KOFXV: '#fde047',
  Naruto: '#22c55e',
};

const FORMAT_LABELS: Record<string, string> = {
  knockout: 'Single Elimination',
  group_ko: 'Group Stage + Knockout',
  league: 'League (Round Robin)',
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await serverSupabase
    .from('tournaments')
    .select('name')
    .eq('id', id)
    .single();
  return { title: data ? `Register — ${data.name}` : 'Register' };
}

export default async function RegisterPage({ params }: { params: Params }) {
  const { id } = await params;

  const { data: tournament } = await serverSupabase
    .from('tournaments')
    .select(`
      id, name, slug, game_type, format, status,
      entry_fee, prize_pool, max_players, start_at,
      registration_deadline, rules,
      arcades(name, city)
    `)
    .eq('id', id)
    .single();

  if (!tournament) notFound();

  if (tournament.status === 'completed' || tournament.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-400 text-lg">This tournament is no longer accepting registrations.</p>
        </div>
      </div>
    );
  }

  const arcade = (tournament as any).arcades as { name: string; city: string } | null;
  const accentColor = GAME_COLORS[tournament.game_type] ?? '#71717a';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

      {/* Tournament banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8">
        <div className="h-1.5 w-full" style={{ background: accentColor }} />
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>
            {tournament.game_type}
          </p>
          <h1 className="font-display text-3xl text-white mb-3">{tournament.name}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-400">
            {arcade && <span>{arcade.name} · {arcade.city}</span>}
            <span>{formatDate(tournament.start_at, 'time')}</span>
            <span>{FORMAT_LABELS[tournament.format] ?? tournament.format}</span>
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500">Entry fee</p>
              <p className="text-white font-bold">{formatCurrency(tournament.entry_fee)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Prize pool</p>
              <p className="text-yellow-400 font-bold">{formatCurrency(tournament.prize_pool)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Max players</p>
              <p className="text-white font-bold">{tournament.max_players}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration form */}
      <RegistrationForm
        tournamentId={tournament.id}
        gameType={tournament.game_type}
        rules={tournament.rules ?? null}
        registrationDeadline={tournament.registration_deadline ?? null}
        maxPlayers={tournament.max_players}
      />
    </div>
  );
}
