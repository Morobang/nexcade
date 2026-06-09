'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { TournamentBracket } from './TournamentBracket';
import { Trophy, Wifi, WifiOff } from 'lucide-react';

type Player = { id: string; gamer_tag: string; full_name: string };
type ResultRow = { profile_id: string; placement: number };

export function BracketClient({
  tournamentId,
  tournamentStatus,
  initialPlayers,
  initialResults,
}: {
  tournamentId: string;
  tournamentStatus: string;
  initialPlayers: Player[];
  initialResults: ResultRow[];
}) {
  const [results, setResults] = useState<ResultRow[]>(initialResults);
  const [newWinnerId, setNewWinnerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const animTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLive = tournamentStatus === 'live';

  useEffect(() => {
    const channel = supabase
      .channel(`bracket-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'results',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          const row = payload.new as { profile_id: string; placement: number } | null;
          if (!row) return;

          setResults((prev) => {
            const without = prev.filter((r) => r.profile_id !== row.profile_id);
            return [...without, { profile_id: row.profile_id, placement: row.placement }];
          });

          // Animate the newly updated slot
          setNewWinnerId(row.profile_id);
          setLastUpdate(new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

          if (animTimeout.current) clearTimeout(animTimeout.current);
          animTimeout.current = setTimeout(() => setNewWinnerId(null), 3000);
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (animTimeout.current) clearTimeout(animTimeout.current);
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const winner = results.find((r) => r.placement === 1);
  const winnerPlayer = winner ? initialPlayers.find((p) => p.id === winner.profile_id) : null;

  return (
    <div className="flex flex-col gap-6">

      {/* Live status bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {isLive ? (
            <>
              <span className="relative flex w-2.5 h-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-red-500" />
              </span>
              <span className="text-red-400 text-sm font-bold uppercase tracking-wider">Live</span>
            </>
          ) : (
            <span className="text-zinc-500 text-sm">Results auto-update as admin enters them</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-zinc-600 text-xs">Last update: {lastUpdate}</span>
          )}
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${connected ? 'text-green-500' : 'text-zinc-600'}`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? 'Connected' : 'Connecting…'}
          </div>
        </div>
      </div>

      {/* Current match indicator */}
      {newWinnerId && (() => {
        const p = initialPlayers.find((pl) => pl.id === newWinnerId);
        return p ? (
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 animate-pulse">
            <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-yellow-300 text-sm font-semibold">
              Result in — <span className="font-black">{p.gamer_tag}</span> just placed!
            </p>
          </div>
        ) : null;
      })()}

      {/* Bracket */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <TournamentBracket
          players={initialPlayers}
          results={results}
          newWinnerId={newWinnerId}
        />
      </div>

      {/* Champion callout */}
      {winnerPlayer && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-yellow-600 uppercase tracking-widest font-bold mb-0.5">Champion</p>
            <p className="font-display text-3xl text-yellow-300 leading-none">{winnerPlayer.gamer_tag}</p>
            <p className="text-zinc-500 text-sm mt-0.5">{winnerPlayer.full_name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
