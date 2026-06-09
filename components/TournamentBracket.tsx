'use client';

import { Trophy } from 'lucide-react';

type Player = { id: string; gamer_tag: string; full_name: string };
type ResultMap = Map<string, number>; // profile_id → placement

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function getRoundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semi-Finals';
  if (fromEnd === 2) return 'Quarter-Finals';
  return `Round ${round + 1}`;
}

// A slot in the bracket – either a known player or TBD/BYE
function Slot({
  player,
  isBye,
  placement,
  highlightWinner,
  isNewWinner,
}: {
  player: Player | null;
  isBye?: boolean;
  placement?: number;
  highlightWinner?: boolean;
  isNewWinner?: boolean;
}) {
  const isWinner = placement === 1;
  const isRunnerUp = placement === 2;

  if (isBye || !player) {
    return (
      <div className="h-10 px-3 flex items-center rounded-lg border border-dashed border-zinc-800 text-zinc-700 text-xs italic">
        {isBye ? 'BYE' : 'TBD'}
      </div>
    );
  }

  return (
    <div className={`h-10 px-3 flex items-center justify-between gap-2 rounded-lg border text-sm transition-all duration-500 ${
      isNewWinner
        ? 'bg-yellow-500/30 border-yellow-400 text-yellow-200 animate-pulse'
        : isWinner
        ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
        : isRunnerUp
        ? 'bg-zinc-700/40 border-zinc-600 text-zinc-300'
        : highlightWinner
        ? 'bg-zinc-900 border-zinc-700 text-zinc-500'
        : 'bg-zinc-900 border-zinc-700 text-zinc-300'
    }`}>
      <span className="font-semibold truncate">{player.gamer_tag}</span>
      {isWinner && <span className="text-yellow-400 text-xs font-bold shrink-0">1st</span>}
      {isRunnerUp && <span className="text-zinc-400 text-xs font-semibold shrink-0">2nd</span>}
    </div>
  );
}

// One match – two players, optional winner
function Match({
  p1,
  p2,
  results,
  isFinal,
  newWinnerId,
}: {
  p1: Player | null;
  p2: Player | null;
  results: ResultMap;
  isFinal: boolean;
  newWinnerId?: string | null;
}) {
  const p1Place = p1 ? results.get(p1.id) : undefined;
  const p2Place = p2 ? results.get(p2.id) : undefined;

  const p1IsWinner = isFinal ? p1Place === 1 : (p1Place !== undefined && p2Place !== undefined && p1Place < p2Place);
  const p2IsWinner = isFinal ? p2Place === 1 : (p2Place !== undefined && p1Place !== undefined && p2Place < p1Place);
  const hasResult = p1Place !== undefined || p2Place !== undefined;

  return (
    <div className="flex flex-col gap-1">
      <Slot
        player={p1}
        isBye={p1 === null}
        placement={isFinal ? p1Place : (p1IsWinner ? 1 : p1Place)}
        highlightWinner={hasResult && !p1IsWinner}
        isNewWinner={!!p1 && p1.id === newWinnerId}
      />
      <Slot
        player={p2}
        isBye={p2 === null}
        placement={isFinal ? p2Place : (p2IsWinner ? 1 : p2Place)}
        highlightWinner={hasResult && !p2IsWinner}
        isNewWinner={!!p2 && p2.id === newWinnerId}
      />
    </div>
  );
}

export function TournamentBracket({
  players,
  results,
  newWinnerId,
}: {
  players: Player[];
  results: { profile_id: string; placement: number }[];
  newWinnerId?: string | null;
}) {
  const resultMap: ResultMap = new Map(results.map((r) => [r.profile_id, r.placement]));
  const totalSlots = nextPow2(Math.max(players.length, 2));
  const totalRounds = Math.log2(totalSlots);

  // Seed players into slots – simple sequential seeding
  const slots: (Player | null)[] = [
    ...players,
    ...Array(totalSlots - players.length).fill(null),
  ];

  // Build rounds
  // Round 0: initial slots paired up
  // We don't know intermediate round winners, so we approximate:
  // A player advanced to round R if their placement ≤ totalSlots / 2^R
  const rounds: { p1: Player | null; p2: Player | null }[][] = [];

  // Round 1 pairs (seeded)
  const round1: { p1: Player | null; p2: Player | null }[] = [];
  for (let i = 0; i < totalSlots; i += 2) {
    round1.push({ p1: slots[i], p2: slots[i + 1] });
  }
  rounds.push(round1);

  // Subsequent rounds — approximate advancement from placements
  let prev = round1;
  for (let r = 1; r < totalRounds; r++) {
    const threshold = totalSlots / Math.pow(2, r);
    const advancedPlayers = players.filter((p) => {
      const place = resultMap.get(p.id);
      return place !== undefined ? place <= threshold : true;
    });

    const next: { p1: Player | null; p2: Player | null }[] = [];
    for (let i = 0; i < prev.length / 2; i++) {
      const p1 = advancedPlayers[i * 2] ?? null;
      const p2 = advancedPlayers[i * 2 + 1] ?? null;
      next.push({ p1, p2 });
    }
    rounds.push(next);
    prev = next;
  }

  const winner = players.find((p) => resultMap.get(p.id) === 1);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {rounds.map((round, ri) => {
          const isFinalRound = ri === rounds.length - 1;
          return (
            <div key={ri} className="flex flex-col">
              {/* Round label */}
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 text-center">
                {getRoundName(ri, totalRounds - 1)}
              </p>

              {/* Matches spaced evenly */}
              <div
                className="flex flex-col justify-around flex-1 gap-4"
                style={{ minHeight: `${round1.length * 88}px` }}
              >
                {round.map((match, mi) => (
                  <Match
                    key={mi}
                    p1={match.p1}
                    p2={match.p2}
                    results={resultMap}
                    isFinal={isFinalRound}
                    newWinnerId={newWinnerId}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Champion column */}
        <div className="flex flex-col">
          <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-3 text-center">Champion</p>
          <div className="flex flex-col justify-around flex-1" style={{ minHeight: `${round1.length * 88}px` }}>
            <div className="h-10 px-4 flex items-center gap-2 rounded-lg border bg-yellow-500/20 border-yellow-500/40">
              {winner ? (
                <>
                  <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="text-yellow-300 font-bold">{winner.gamer_tag}</span>
                </>
              ) : (
                <span className="text-zinc-600 text-xs italic">Awaiting result</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
