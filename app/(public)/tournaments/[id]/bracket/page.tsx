import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { BracketClient } from '@/components/BracketClient';
import { ArrowLeft, Shield } from 'lucide-react';

type Params = Promise<{ id: string }>;

const GAME_COLOR: Record<string, string> = {
  FC26:    'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Tekken8: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  SF6:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  MK1:     'text-pink-400 bg-pink-400/10 border-pink-400/20',
  KOFXV:   'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
  Naruto:  'text-green-400 bg-green-400/10 border-green-400/20',
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id: slug } = await params;
  const { data } = await serverSupabase.from('tournaments').select('name').eq('slug', slug).single();
  return { title: data ? `${data.name} — Bracket` : 'Tournament Bracket' };
}

export default async function BracketPage({ params }: { params: Params }) {
  const { id: slug } = await params;

  const { data: tournament } = await serverSupabase
    .from('tournaments')
    .select('id, name, slug, game_type, format, status, max_players, is_qualifier')
    .eq('slug', slug)
    .single();

  if (!tournament) notFound();

  const [{ data: regData }, { data: resultData }] = await Promise.all([
    serverSupabase
      .from('registrations')
      .select('profile_id, profiles(id, gamer_tag, full_name)')
      .eq('tournament_id', id)
      .neq('registration_status', 'cancelled')
      .order('registered_at', { ascending: true }),
    serverSupabase
      .from('results')
      .select('profile_id, placement, is_winner')
      .eq('tournament_id', id)
      .order('placement', { ascending: true }),
  ]);

  const players = (regData ?? []).map((r) => {
    const p = (r as any).profiles as { id: string; gamer_tag: string; full_name: string } | null;
    return p ?? null;
  }).filter(Boolean) as { id: string; gamer_tag: string; full_name: string }[];

  const results = (resultData ?? []) as { profile_id: string; placement: number }[];

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back link */}
      <Link
        href={`/tournaments/${tournament.slug}`}
        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tournament
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${GAME_COLOR[tournament.game_type] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
            {tournament.game_type}
          </span>
          {tournament.is_qualifier && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border text-purple-400 bg-purple-400/10 border-purple-400/20">
              <Shield className="w-3 h-3" />
              Qualifier
            </span>
          )}
        </div>
        <h1 className="font-display text-4xl text-white leading-none">{tournament.name.toUpperCase()}</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {players.length} / {tournament.max_players} players · Single Elimination
        </p>
      </div>

      {/* Bracket — realtime client component */}
      {players.length < 2 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500">Not enough players registered to generate a bracket.</p>
        </div>
      ) : (
        <BracketClient
          tournamentId={tournament.id}
          tournamentStatus={tournament.status}
          initialPlayers={players}
          initialResults={results}
        />
      )}

      {/* Final Standings */}
      {results.length > 0 && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Final Standings</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {results.slice(0, 8).map((r) => {
              const player = players.find((p) => p.id === r.profile_id);
              if (!player) return null;
              return (
                <div key={r.profile_id} className="px-5 py-3 flex items-center gap-4">
                  <span className={`font-display text-2xl leading-none w-8 shrink-0 ${
                    r.placement === 1 ? 'text-yellow-400' : r.placement === 2 ? 'text-zinc-400' : r.placement === 3 ? 'text-orange-600' : 'text-zinc-600'
                  }`}>
                    {r.placement}
                  </span>
                  <div>
                    <p className="text-zinc-200 font-semibold text-sm">{player.gamer_tag}</p>
                    <p className="text-zinc-500 text-xs">{player.full_name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
