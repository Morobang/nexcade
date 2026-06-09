'use client';

import type { ReactElement } from 'react';
import { Trophy } from 'lucide-react';

// Layout constants
const MATCH_H = 76;   // px — height of one match card (2 × 38px rows)
const MATCH_W = 192;  // px — width of one match card
const CHAMP_W = MATCH_W;
const BASE_UNIT = 96; // px — vertical cell height in round 0 (must be > MATCH_H)
const CONN_W = 48;    // px — horizontal space between rounds (for connector lines)
const ROUND_W = MATCH_W + CONN_W;
const CHAMP_H = 100;  // px — champion card height
const LINE = '#3f3f46'; // zinc-700

function matchTop(m: number, r: number): number {
  const cell = BASE_UNIT * Math.pow(2, r);
  return m * cell + (cell - MATCH_H) / 2;
}

function matchCenterY(m: number, r: number): number {
  return (m + 0.5) * BASE_UNIT * Math.pow(2, r);
}

type Player = { tag: string; isTBD: boolean; isChampion?: boolean };
type Match = { top: Player; bottom: Player };

const TBD: Player = { tag: 'TBD', isTBD: true };

function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
}

function buildRounds(
  players: string[],
  maxPlayers: number,
  champion: string | null,
  runnerUp: string | null,
  isCompleted: boolean,
): Match[][] {
  const size = nextPow2(maxPlayers);
  const seeded: Player[] = players
    .slice(0, size)
    .map(g => ({ tag: g, isTBD: false, isChampion: g === champion }));
  while (seeded.length < size) seeded.push({ ...TBD });

  const rounds: Match[][] = [];

  // Round 0 — seed all players into pairs
  const r0: Match[] = [];
  for (let i = 0; i < size; i += 2) {
    r0.push({ top: seeded[i], bottom: seeded[i + 1] });
  }
  rounds.push(r0);

  // Subsequent rounds — TBD, except the final if tournament is completed
  const totalRounds = Math.round(Math.log2(size));
  for (let r = 1; r < totalRounds; r++) {
    const count = Math.pow(2, totalRounds - r - 1);
    const isFinal = count === 1;
    const round: Match[] = Array.from({ length: count }, () => {
      if (isCompleted && isFinal && champion && runnerUp) {
        return {
          top: { tag: runnerUp, isTBD: false },
          bottom: { tag: champion, isTBD: false, isChampion: true },
        };
      }
      return { top: { ...TBD }, bottom: { ...TBD } };
    });
    rounds.push(round);
  }

  return rounds;
}

function getRoundLabel(r: number, total: number): string {
  const fromEnd = total - 1 - r;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semi-finals';
  if (fromEnd === 2) return 'Quarter-finals';
  return `Round ${r + 1}`;
}

function PlayerRow({ player, alt }: { player: Player; alt?: boolean }) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 h-[38px] text-sm
        ${player.isChampion ? 'bg-yellow-500/10' : alt ? 'bg-zinc-800/40' : 'bg-zinc-900'}
      `}
    >
      {player.isChampion && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
      <span
        className={`
          font-semibold truncate
          ${player.isTBD ? 'text-zinc-600 italic font-normal' : player.isChampion ? 'text-yellow-400' : 'text-zinc-200'}
        `}
      >
        {player.tag}
      </span>
    </div>
  );
}

interface Props {
  players: string[];
  maxPlayers: number;
  champion: string | null;
  runnerUp: string | null;
  isCompleted: boolean;
}

export function BracketView({ players, maxPlayers, champion, runnerUp, isCompleted }: Props) {
  if (players.length === 0) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500">No players registered yet.</p>
        <p className="text-zinc-600 text-sm mt-1">The bracket will appear once players register.</p>
      </div>
    );
  }

  const rounds = buildRounds(players, maxPlayers, champion, runnerUp, isCompleted);
  const numRounds = rounds.length;
  const numR0 = rounds[0].length;
  const totalH = numR0 * BASE_UNIT;
  const totalW = numRounds * ROUND_W + CONN_W + CHAMP_W;

  return (
    <div className="overflow-x-auto pb-6 -mx-4 px-4">
      {/* Round labels */}
      <div className="flex mb-3" style={{ minWidth: totalW }}>
        {rounds.map((_, r) => (
          <div
            key={r}
            className="text-xs text-zinc-500 uppercase tracking-widest text-center font-semibold shrink-0"
            style={{ width: ROUND_W }}
          >
            {getRoundLabel(r, numRounds)}
          </div>
        ))}
        <div
          className="text-xs text-zinc-500 uppercase tracking-widest text-center font-semibold shrink-0"
          style={{ width: CHAMP_W + CONN_W }}
        >
          Champion
        </div>
      </div>

      {/* Bracket canvas */}
      <div className="relative" style={{ width: totalW, height: totalH }}>

        {rounds.flatMap((roundMatches, r) =>
          roundMatches.flatMap((match, m) => {
            const top = matchTop(m, r);
            const left = r * ROUND_W;
            const cy = matchCenterY(m, r);
            const isLast = r === numRounds - 1;
            const isPairStart = m % 2 === 0;
            const hasPair = isPairStart && m + 1 < roundMatches.length;

            const els: ReactElement[] = [];

            // ── Match card ──────────────────────────────────────
            els.push(
              <div
                key={`mc-${r}-${m}`}
                className="border border-zinc-800 rounded-lg overflow-hidden absolute"
                style={{ top, left, width: MATCH_W }}
              >
                <PlayerRow player={match.top} />
                <div className="h-px bg-zinc-800" />
                <PlayerRow player={match.bottom} alt />
              </div>
            );

            // ── Horizontal line right from this match ────────────
            els.push(
              <div
                key={`hl-${r}-${m}`}
                style={{
                  position: 'absolute',
                  left: left + MATCH_W,
                  top: cy - 0.5,
                  width: isLast ? CONN_W : CONN_W / 2,
                  height: 1,
                  background: LINE,
                }}
              />
            );

            // ── Vertical + output lines for each pair start ──────
            if (!isLast && hasPair) {
              const partnerCY = matchCenterY(m + 1, r);
              const midY = (cy + partnerCY) / 2;
              const vx = left + MATCH_W + CONN_W / 2 - 0.5;

              // Vertical bar
              els.push(
                <div
                  key={`vl-${r}-${m}`}
                  style={{
                    position: 'absolute',
                    left: vx,
                    top: cy,
                    width: 1,
                    height: partnerCY - cy,
                    background: LINE,
                  }}
                />
              );

              // Output horizontal to next round
              els.push(
                <div
                  key={`ol-${r}-${m}`}
                  style={{
                    position: 'absolute',
                    left: vx + 0.5,
                    top: midY - 0.5,
                    width: CONN_W / 2,
                    height: 1,
                    background: LINE,
                  }}
                />
              );
            }

            return els;
          })
        )}

        {/* ── Champion slot ─────────────────────────────────────── */}
        <div
          className="absolute"
          style={{
            left: numRounds * ROUND_W + CONN_W,
            top: totalH / 2 - CHAMP_H / 2,
            width: CHAMP_W,
          }}
        >
          {/* Input line from final */}
          <div
            style={{
              position: 'absolute',
              left: -CONN_W,
              top: CHAMP_H / 2 - 0.5,
              width: CONN_W,
              height: 1,
              background: LINE,
            }}
          />
          <div className="border border-yellow-500/40 bg-yellow-500/10 rounded-xl flex flex-col items-center justify-center gap-2 text-center" style={{ height: CHAMP_H }}>
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Champion</p>
              <p className={`font-bold ${champion ? 'text-yellow-400' : 'text-zinc-600 italic text-sm'}`}>
                {champion ?? 'TBD'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
