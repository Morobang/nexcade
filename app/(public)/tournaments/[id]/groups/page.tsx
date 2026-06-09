import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { ArrowLeft, Shield, Trophy } from 'lucide-react';

type Params = Promise<{ id: string }>;

// ── Types ─────────────────────────────────────────────────────────────────────

type Player = { id: string; gamer_tag: string; full_name: string };

type MatchRow = {
  id: string;
  group_name: string | null;
  player1_id: string;
  player2_id: string;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: string | null;
  status: string;
};

type StandingRow = {
  player: Player;
  played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; points: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeStandings(players: Player[], matches: MatchRow[], groupName: string): StandingRow[] {
  const stats: Record<string, { w: number; d: number; l: number; gf: number; ga: number }> = {};
  for (const p of players) stats[p.id] = { w: 0, d: 0, l: 0, gf: 0, ga: 0 };

  for (const m of matches) {
    if (m.group_name !== groupName || m.status !== 'completed') continue;
    if (!stats[m.player1_id] || !stats[m.player2_id]) continue;
    const s1 = m.player1_score ?? 0;
    const s2 = m.player2_score ?? 0;
    stats[m.player1_id].gf += s1; stats[m.player1_id].ga += s2;
    stats[m.player2_id].gf += s2; stats[m.player2_id].ga += s1;
    if (s1 > s2)      { stats[m.player1_id].w++; stats[m.player2_id].l++; }
    else if (s2 > s1) { stats[m.player2_id].w++; stats[m.player1_id].l++; }
    else              { stats[m.player1_id].d++; stats[m.player2_id].d++; }
  }

  return players
    .map(p => ({
      player: p,
      played: stats[p.id].w + stats[p.id].d + stats[p.id].l,
      won: stats[p.id].w, drawn: stats[p.id].d, lost: stats[p.id].l,
      gf: stats[p.id].gf, ga: stats[p.id].ga,
      points: stats[p.id].w * 3 + stats[p.id].d,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdDiff = (b.gf - b.ga) - (a.gf - a.ga);
      if (gdDiff !== 0) return gdDiff;
      return b.gf - a.gf;
    });
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id: slug } = await params;
  const { data } = await serverSupabase.from('tournaments').select('name').eq('slug', slug).single();
  return { title: data ? `${data.name} — Group Stage` : 'Group Stage' };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GroupsPage({ params }: { params: Params }) {
  const { id: slug } = await params;

  const { data: tournament } = await serverSupabase
    .from('tournaments')
    .select('id, name, slug, game_type, status, is_qualifier')
    .eq('slug', slug)
    .single();

  if (!tournament) notFound();

  const [
    { data: regData },
    { data: gaData },
    { data: matchData },
    { data: resultData },
  ] = await Promise.all([
    serverSupabase
      .from('registrations')
      .select('profile_id, profiles(id, gamer_tag, full_name)')
      .eq('tournament_id', tournament.id)
      .neq('registration_status', 'cancelled'),
    serverSupabase
      .from('group_assignments')
      .select('profile_id, group_name')
      .eq('tournament_id', tournament.id),
    serverSupabase
      .from('matches')
      .select('id, group_name, player1_id, player2_id, player1_score, player2_score, winner_id, status')
      .eq('tournament_id', tournament.id)
      .eq('round_type', 'group'),
    serverSupabase
      .from('results')
      .select('profile_id')
      .eq('tournament_id', tournament.id),
  ]);

  const allPlayers: Player[] = (regData ?? [])
    .map(r => (r as any).profiles as Player | null)
    .filter(Boolean) as Player[];

  const assignMap = new Map<string, string>(
    (gaData ?? []).map(a => [a.profile_id, a.group_name])
  );

  const matches = (matchData ?? []) as MatchRow[];

  // Players with a result recorded have been eliminated from group stage
  const eliminatedIds = new Set((resultData ?? []).map(r => r.profile_id));

  const groups = [...new Set((gaData ?? []).map(a => a.group_name))].sort();

  if (groups.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href={`/tournaments/${tournament.slug}`}
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />Back to tournament
        </Link>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-semibold">Group stage not yet set up</p>
          <p className="text-zinc-600 text-sm mt-1">The admin will set up groups before the tournament begins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back */}
      <Link href={`/tournaments/${tournament.slug}`}
        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />Back to tournament
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {tournament.is_qualifier && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border text-purple-400 bg-purple-400/10 border-purple-400/20">
                <Shield className="w-3 h-3" />Qualifier
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border text-blue-400 bg-blue-400/10 border-blue-400/20">
              Group Stage
            </span>
          </div>
          <h1 className="font-display text-4xl text-white leading-none">{tournament.name.toUpperCase()}</h1>
          <p className="text-zinc-500 text-sm mt-1">{groups.length} groups · {allPlayers.length} players</p>
        </div>

        <Link href={`/tournaments/${tournament.slug}/bracket`}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl text-zinc-300 text-sm font-semibold transition-colors">
          <Trophy className="w-4 h-4 text-yellow-400" />Knockout Bracket
        </Link>
      </div>

      {/* Group standings */}
      <div className="flex flex-col gap-8">
        {groups.map(group => {
          const groupPlayers = allPlayers.filter(p => assignMap.get(p.id) === group);
          const standings = computeStandings(groupPlayers, matches, group);
          const groupMatches = matches.filter(m => m.group_name === group);
          const completedCount = groupMatches.filter(m => m.status === 'completed').length;

          return (
            <div key={group} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-white leading-none">GROUP {group}</h2>
                  <p className="text-zinc-500 text-xs mt-1">{completedCount}/{groupMatches.length} matches played</p>
                </div>
                {completedCount === groupMatches.length && completedCount > 0 && (
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                    Complete
                  </span>
                )}
              </div>

              {/* Standings table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5 text-left w-8">#</th>
                      <th className="px-4 py-2.5 text-left">Player</th>
                      <th className="px-4 py-2.5 text-center w-10">P</th>
                      <th className="px-4 py-2.5 text-center w-10">W</th>
                      <th className="px-4 py-2.5 text-center w-10">D</th>
                      <th className="px-4 py-2.5 text-center w-10">L</th>
                      <th className="px-4 py-2.5 text-center w-14">GD</th>
                      <th className="px-4 py-2.5 text-center w-12">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {standings.map((row, idx) => {
                      const eliminated = eliminatedIds.has(row.player.id);
                      return (
                        <tr key={row.player.id}
                          className={`hover:bg-zinc-800/40 transition-colors ${!eliminated && idx === 0 ? 'border-l-2 border-green-500' : eliminated ? 'opacity-50' : idx < 2 ? 'border-l-2 border-green-500/60' : ''}`}>
                          <td className="px-4 py-3 text-zinc-600 font-bold text-center">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className={`font-semibold text-sm ${eliminated ? 'line-through text-zinc-600' : idx < 2 ? 'text-white' : 'text-zinc-300'}`}>
                                  {row.player.gamer_tag}
                                </p>
                                <p className="text-zinc-600 text-xs">{row.player.full_name}</p>
                              </div>
                              {eliminated && (
                                <span className="text-xs text-red-500 font-semibold">Out</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-zinc-400">{row.played}</td>
                          <td className="px-4 py-3 text-center font-semibold text-green-400">{row.won}</td>
                          <td className="px-4 py-3 text-center text-zinc-400">{row.drawn}</td>
                          <td className="px-4 py-3 text-center text-red-400">{row.lost}</td>
                          <td className="px-4 py-3 text-center text-zinc-300">{row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}</td>
                          <td className="px-4 py-3 text-center font-bold text-white">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Recent results */}
              {completedCount > 0 && (
                <div className="px-5 py-4 border-t border-zinc-800/50 bg-zinc-800/20">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Results</p>
                  <div className="flex flex-col gap-1.5">
                    {groupMatches.filter(m => m.status === 'completed').map(m => {
                      const p1 = allPlayers.find(p => p.id === m.player1_id);
                      const p2 = allPlayers.find(p => p.id === m.player2_id);
                      return (
                        <div key={m.id} className="flex items-center gap-3 text-sm">
                          <span className={`flex-1 text-right text-xs font-semibold truncate ${m.winner_id === m.player1_id ? 'text-white' : 'text-zinc-500'}`}>
                            {p1?.gamer_tag ?? '—'}
                          </span>
                          <span className="text-zinc-300 text-xs font-mono font-bold shrink-0">
                            {m.player1_score} — {m.player2_score}
                          </span>
                          <span className={`flex-1 text-xs font-semibold truncate ${m.winner_id === m.player2_id ? 'text-white' : 'text-zinc-500'}`}>
                            {p2?.gamer_tag ?? '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
