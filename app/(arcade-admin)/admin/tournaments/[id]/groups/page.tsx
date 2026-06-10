'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Users, Play, Trophy, Save, Shuffle,
  Loader2, AlertCircle, CheckCircle2, ChevronRight,
} from 'lucide-react';

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

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

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
      played: (stats[p.id].w) + (stats[p.id].d) + (stats[p.id].l),
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminTournamentGroupsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tab, setTab] = useState<'setup' | 'results' | 'standings'>('setup');
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const [tournamentName, setTournamentName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [numGroups, setNumGroups] = useState(2);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [scores, setScores] = useState<Record<string, { s1: string; s2: string }>>({});
  const [advancers, setAdvancers] = useState(2);

  const groups = useMemo(() => GROUP_NAMES.slice(0, numGroups), [numGroups]);
  const activeGroups = useMemo(
    () => [...new Set(Object.values(assignments))].filter(Boolean).sort(),
    [assignments]
  );

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['arcade_owner', 'platform_admin'].includes(profile.role)) {
      setUnauthorized(true); setLoading(false); return;
    }

    const { data: t } = await supabase.from('tournaments').select('name').eq('id', tournamentId).single();
    if (t) setTournamentName(t.name);

    const { data: regs } = await supabase
      .from('registrations')
      .select('profile_id, profiles(id, gamer_tag, full_name)')
      .eq('tournament_id', tournamentId)
      .neq('registration_status', 'cancelled');

    const playerList: Player[] = (regs ?? [])
      .map(r => (r as any).profiles as Player | null)
      .filter(Boolean) as Player[];
    setPlayers(playerList);

    const { data: ga } = await supabase
      .from('group_assignments')
      .select('profile_id, group_name')
      .eq('tournament_id', tournamentId);

    const assignMap: Record<string, string> = {};
    for (const a of ga ?? []) assignMap[a.profile_id] = a.group_name;
    setAssignments(assignMap);

    const usedGroups = [...new Set((ga ?? []).map((a) => a.group_name))];
    if (usedGroups.length > 0) setNumGroups(Math.max(2, usedGroups.length));

    const { data: m } = await supabase
      .from('matches')
      .select('id, group_name, player1_id, player2_id, player1_score, player2_score, winner_id, status')
      .eq('tournament_id', tournamentId)
      .eq('round_type', 'group');

    setMatches(m ?? []);
    const scoreMap: Record<string, { s1: string; s2: string }> = {};
    for (const match of m ?? []) {
      scoreMap[match.id] = {
        s1: match.player1_score?.toString() ?? '',
        s2: match.player2_score?.toString() ?? '',
      };
    }
    setScores(scoreMap);
    setLoading(false);
  }, [tournamentId, router]);

  useEffect(() => { load(); }, [load]);

  function autoDistribute() {
    const updated: Record<string, string> = {};
    players.forEach((p, i) => { updated[p.id] = GROUP_NAMES[i % numGroups]; });
    setAssignments(updated);
  }

  async function saveAssignments() {
    setSaving('assignments');
    await supabase.from('group_assignments').delete().eq('tournament_id', tournamentId);
    const rows = Object.entries(assignments)
      .filter(([, g]) => !!g)
      .map(([profileId, groupName]) => ({ tournament_id: tournamentId, profile_id: profileId, group_name: groupName }));
    if (rows.length > 0) await supabase.from('group_assignments').insert(rows);
    setSaving(null);
  }

  async function generateFixtures() {
    setSaving('fixtures');
    await supabase.from('matches').delete()
      .eq('tournament_id', tournamentId).eq('round_type', 'group').eq('status', 'scheduled');

    const fixtureRows: object[] = [];
    for (const group of activeGroups) {
      const ids = players.filter(p => assignments[p.id] === group).map(p => p.id);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          fixtureRows.push({ tournament_id: tournamentId, round_type: 'group', group_name: group, player1_id: ids[i], player2_id: ids[j], status: 'scheduled' });
        }
      }
    }

    if (fixtureRows.length > 0) {
      const { data: newM } = await supabase.from('matches').insert(fixtureRows).select();
      setMatches(prev => [...prev.filter(m => m.status === 'completed'), ...(newM ?? [])]);
      setScores(prev => {
        const updated = { ...prev };
        for (const m of newM ?? []) updated[m.id] = { s1: '', s2: '' };
        return updated;
      });
    }
    setSaving(null);
  }

  async function saveScore(matchId: string) {
    const { s1, s2 } = scores[matchId] ?? { s1: '', s2: '' };
    const p1 = parseInt(s1), p2 = parseInt(s2);
    if (isNaN(p1) || isNaN(p2)) return;
    setSaving(matchId);
    const match = matches.find(m => m.id === matchId);
    if (!match) { setSaving(null); return; }
    const winnerId = p1 > p2 ? match.player1_id : p2 > p1 ? match.player2_id : null;
    await supabase.from('matches').update({
      player1_score: p1, player2_score: p2, winner_id: winnerId,
      status: 'completed', played_at: new Date().toISOString(),
    }).eq('id', matchId);
    setMatches(prev => prev.map(m => m.id === matchId
      ? { ...m, player1_score: p1, player2_score: p2, winner_id: winnerId, status: 'completed' } : m));
    setSaving(null);
  }

  async function advancePlayers() {
    setSaving('advance');
    for (const group of activeGroups) {
      const groupPlayers = players.filter(p => assignments[p.id] === group);
      const standings = computeStandings(groupPlayers, matches, group);
      const eliminated = standings.slice(advancers);
      for (let i = 0; i < eliminated.length; i++) {
        const pid = eliminated[i].player.id;
        const { data: existing } = await supabase.from('results')
          .select('id').eq('tournament_id', tournamentId).eq('profile_id', pid).maybeSingle();
        if (!existing) {
          await supabase.from('results').insert({
            tournament_id: tournamentId, profile_id: pid,
            placement: activeGroups.length * advancers + i + 1,
            is_winner: false, points_awarded: 0,
          });
        }
      }
    }
    setSaving(null);
  }

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
    </div>
  );

  if (unauthorized) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-sm">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h1 className="font-display text-2xl text-white mb-2">ACCESS DENIED</h1>
        <Link href="/" className="text-red-400 text-sm">Back to home</Link>
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/tournaments" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>
        <span className="text-zinc-700">/</span>
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Group Stage</p>
          <h1 className="font-display text-3xl text-white leading-none">{tournamentName.toUpperCase()}</h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-8">
        {([
          ['setup',     'Group Setup',    Users  ],
          ['results',   'Match Results',  Play   ],
          ['standings', 'Standings',      Trophy ],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Tab: Setup ─────────────────────────────────────────────────────── */}
      {tab === 'setup' && (
        <div className="flex flex-col gap-6">

          {/* Number of groups */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Number of Groups</h2>
            <div className="flex gap-2 flex-wrap">
              {[2, 3, 4, 6, 8].map(n => (
                <button key={n} onClick={() => setNumGroups(n)}
                  className={`px-4 py-2 rounded-xl border text-sm font-bold transition-colors ${numGroups === n ? 'bg-red-600 border-red-600 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                  {n} Groups
                </button>
              ))}
            </div>
          </div>

          {/* Player assignment */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Player Assignments</h2>
              <span className="text-zinc-500 text-xs">{players.length} players</span>
            </div>
            {players.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No registered players found.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {players.map(p => (
                  <div key={p.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 font-semibold text-sm truncate">{p.gamer_tag}</p>
                      <p className="text-zinc-500 text-xs truncate">{p.full_name}</p>
                    </div>
                    <select
                      value={assignments[p.id] ?? ''}
                      onChange={e => setAssignments(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-red-500 transition-colors"
                    >
                      <option value="">— unassigned —</option>
                      {groups.map(g => <option key={g} value={g}>Group {g}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button onClick={autoDistribute}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 text-sm font-semibold transition-colors">
              <Shuffle className="w-4 h-4" />Auto-distribute
            </button>
            <button onClick={saveAssignments} disabled={saving === 'assignments'}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 text-sm font-semibold transition-colors disabled:opacity-50">
              {saving === 'assignments' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Assignments
            </button>
            <button onClick={generateFixtures} disabled={!!saving || activeGroups.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50">
              {saving === 'fixtures' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate Fixtures
            </button>
          </div>
          <p className="text-zinc-600 text-xs -mt-2">Save assignments first, then generate fixtures to create the round-robin schedule.</p>
        </div>
      )}

      {/* ── Tab: Results ───────────────────────────────────────────────────── */}
      {tab === 'results' && (
        <div className="flex flex-col gap-6">
          {matches.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <Play className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 mb-4">No fixtures yet. Assign players to groups and click Generate Fixtures.</p>
              <button onClick={() => setTab('setup')}
                className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
                Go to Setup
              </button>
            </div>
          ) : (
            activeGroups.map(group => {
              const groupMatches = matches.filter(m => m.group_name === group);
              return (
                <div key={group} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-zinc-800">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">Group {group}</h3>
                    <p className="text-zinc-600 text-xs mt-0.5">
                      {groupMatches.filter(m => m.status === 'completed').length}/{groupMatches.length} matches completed
                    </p>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {groupMatches.map(m => {
                      const p1 = players.find(p => p.id === m.player1_id);
                      const p2 = players.find(p => p.id === m.player2_id);
                      const isDone = m.status === 'completed';
                      return (
                        <div key={m.id} className="px-5 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                          <span className={`w-28 sm:flex-1 text-sm font-semibold truncate ${m.winner_id === m.player1_id ? 'text-white' : isDone ? 'text-zinc-500' : 'text-zinc-300'}`}>
                            {p1?.gamer_tag ?? '—'}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <input type="number" min="0"
                              value={scores[m.id]?.s1 ?? ''}
                              onChange={e => setScores(prev => ({ ...prev, [m.id]: { ...prev[m.id], s1: e.target.value } }))}
                              className="w-12 text-center bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 text-white text-sm focus:outline-none focus:border-red-500"
                            />
                            <span className="text-zinc-600 text-sm font-bold">—</span>
                            <input type="number" min="0"
                              value={scores[m.id]?.s2 ?? ''}
                              onChange={e => setScores(prev => ({ ...prev, [m.id]: { ...prev[m.id], s2: e.target.value } }))}
                              className="w-12 text-center bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 text-white text-sm focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <span className={`w-28 sm:flex-1 text-sm font-semibold truncate text-right ${m.winner_id === m.player2_id ? 'text-white' : isDone ? 'text-zinc-500' : 'text-zinc-300'}`}>
                            {p2?.gamer_tag ?? '—'}
                          </span>
                          <button onClick={() => saveScore(m.id)} disabled={saving === m.id}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDone ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300'}`}>
                            {saving === m.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            {isDone ? 'Saved' : 'Save'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Tab: Standings ─────────────────────────────────────────────────── */}
      {tab === 'standings' && (
        <div className="flex flex-col gap-6">
          {activeGroups.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">Assign players to groups first.</p>
            </div>
          ) : (
            <>
              {activeGroups.map(group => {
                const groupPlayers = players.filter(p => assignments[p.id] === group);
                const standings = computeStandings(groupPlayers, matches, group);
                return (
                  <div key={group} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-800">
                      <h3 className="text-white font-bold text-sm uppercase tracking-wider">Group {group}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead>
                          <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                            <th className="px-4 py-2 text-left w-8">#</th>
                            <th className="px-4 py-2 text-left">Player</th>
                            <th className="px-4 py-2 text-center w-10">P</th>
                            <th className="px-4 py-2 text-center w-10">W</th>
                            <th className="px-4 py-2 text-center w-10">D</th>
                            <th className="px-4 py-2 text-center w-10">L</th>
                            <th className="px-4 py-2 text-center w-14">GD</th>
                            <th className="px-4 py-2 text-center w-12">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {standings.map((row, idx) => {
                            const qualifies = idx < advancers;
                            return (
                              <tr key={row.player.id}
                                className={`hover:bg-zinc-800/40 transition-colors ${qualifies ? 'border-l-2 border-green-500' : ''}`}>
                                <td className="px-4 py-3 text-zinc-600 font-bold text-center">{idx + 1}</td>
                                <td className="px-4 py-3">
                                  <p className={`font-semibold ${qualifies ? 'text-green-400' : 'text-zinc-400'}`}>{row.player.gamer_tag}</p>
                                  <p className="text-zinc-600 text-xs">{row.player.full_name}</p>
                                </td>
                                <td className="px-4 py-3 text-center text-zinc-400">{row.played}</td>
                                <td className="px-4 py-3 text-center text-green-400 font-semibold">{row.won}</td>
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
                  </div>
                );
              })}

              {/* Advance to knockout */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Advance to Knockout</h3>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className="text-zinc-400 text-sm">Top</span>
                  <select
                    value={advancers}
                    onChange={e => setAdvancers(Number(e.target.value))}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-red-500"
                  >
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="text-zinc-400 text-sm">from each group advance</span>
                </div>
                <button onClick={advancePlayers} disabled={!!saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl text-green-400 text-sm font-bold transition-colors disabled:opacity-50">
                  {saving === 'advance' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Eliminate bottom players
                </button>
                <p className="text-zinc-600 text-xs mt-3">
                  Records group-stage results for eliminated players. Top {advancers} per group continue to the knockout bracket.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
