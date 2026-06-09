import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { BracketView } from '@/components/BracketView';
import { ChevronRight } from 'lucide-react';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const { data } = await serverSupabase
    .from('tournaments')
    .select('name')
    .eq('slug', id)
    .single();
  if (!data) return { title: 'Bracket' };
  return { title: `${data.name} — Bracket` };
}

export default async function BracketPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: tournament } = await serverSupabase
    .from('tournaments')
    .select('id, name, slug, game_type, status, max_players, arcades(name, city)')
    .eq('slug', id)
    .single();

  if (!tournament) notFound();

  const [{ data: registrations }, { data: results }] = await Promise.all([
    serverSupabase
      .from('registrations')
      .select('profiles(gamer_tag)')
      .eq('tournament_id', tournament.id)
      .in('registration_status', ['registered', 'paid', 'checked_in'])
      .order('registered_at', { ascending: true }),
    serverSupabase
      .from('results')
      .select('placement, profiles(gamer_tag)')
      .eq('tournament_id', tournament.id)
      .order('placement', { ascending: true }),
  ]);

  const players = (registrations ?? [])
    .map(r => (r.profiles as unknown as { gamer_tag: string } | null)?.gamer_tag)
    .filter(Boolean) as string[];

  const resultMap = (results ?? []).reduce<Record<number, string>>((acc, r) => {
    const p = r.profiles as unknown as { gamer_tag: string } | null;
    if (p) acc[r.placement] = p.gamer_tag;
    return acc;
  }, {});

  const champion = resultMap[1] ?? null;
  const runnerUp = resultMap[2] ?? null;
  const isCompleted = tournament.status === 'completed';
  const arcade = tournament.arcades as unknown as { name: string; city: string } | null;

  const GAME_COLORS: Record<string, string> = {
    FC26: 'text-orange-400', Tekken8: 'text-blue-400', SF6: 'text-yellow-400',
    MK1: 'text-pink-400', KOFXV: 'text-yellow-300', Naruto: 'text-green-400',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6 flex-wrap">
        <Link href="/tournaments" className="hover:text-white transition-colors">Tournaments</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/tournaments/${id}`} className="hover:text-white transition-colors truncate max-w-[200px]">
          {tournament.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-zinc-300">Bracket</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-white mb-2">{tournament.name}</h1>
        <p className="text-zinc-400 text-sm flex flex-wrap gap-x-3 gap-y-1">
          <span className={GAME_COLORS[tournament.game_type] ?? 'text-zinc-400'}>
            {tournament.game_type}
          </span>
          {arcade && <span>{arcade.name} · {arcade.city}</span>}
          <span className="text-zinc-600">
            {players.length} / {tournament.max_players} registered
          </span>
          {isCompleted && (
            <span className="text-green-400 font-semibold">Completed</span>
          )}
        </p>
      </div>

      {/* Bracket */}
      <BracketView
        players={players}
        maxPlayers={tournament.max_players}
        champion={champion}
        runnerUp={runnerUp}
        isCompleted={isCompleted}
      />

      {/* Mobile hint */}
      <p className="text-zinc-700 text-xs text-center mt-6 sm:hidden">
        Scroll right to see the full bracket
      </p>
    </div>
  );
}
