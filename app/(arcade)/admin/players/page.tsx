'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Users, Search, Loader2, Trophy, ExternalLink } from 'lucide-react';

type Player = {
  id: string;
  gamer_tag: string;
  full_name: string;
  avatar_url: string | null;
  tournament_count: number;
  last_registered: string | null;
};

export default function AdminPlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!['arcade_owner', 'platform_admin'].includes(profile?.role ?? '')) {
        router.replace('/dashboard');
        return;
      }

      // Get the arcade owned by this user (or any arcade for platform admins)
      const { data: arcade } = await supabase
        .from('arcades')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!arcade) { setLoading(false); return; }

      // Get all tournament IDs at this arcade
      const { data: tourneys } = await supabase
        .from('tournaments')
        .select('id')
        .eq('arcade_id', arcade.id);

      const tourneyIds = (tourneys ?? []).map((t) => t.id);
      if (tourneyIds.length === 0) { setLoading(false); return; }

      // Get all registrations for those tournaments
      const { data: regs } = await supabase
        .from('registrations')
        .select('profile_id, tournament_id, registered_at, profiles(id, gamer_tag, full_name, avatar_url)')
        .in('tournament_id', tourneyIds)
        .neq('registration_status', 'cancelled')
        .order('registered_at', { ascending: false });

      // Aggregate by player
      const playerMap = new Map<string, Player>();
      for (const r of (regs ?? [])) {
        const p = (r as any).profiles as { id: string; gamer_tag: string; full_name: string; avatar_url: string | null } | null;
        if (!p) continue;
        const existing = playerMap.get(p.id);
        if (existing) {
          existing.tournament_count += 1;
          if (!existing.last_registered || r.registered_at > existing.last_registered) {
            existing.last_registered = r.registered_at;
          }
        } else {
          playerMap.set(p.id, {
            id: p.id,
            gamer_tag: p.gamer_tag,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            tournament_count: 1,
            last_registered: r.registered_at,
          });
        }
      }

      setPlayers(Array.from(playerMap.values()).sort((a, b) => b.tournament_count - a.tournament_count));
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = players.filter((p) =>
    !search ||
    p.gamer_tag.toLowerCase().includes(search.toLowerCase()) ||
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 text-fg-3 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-fg mb-1">PLAYERS</h1>
          <p className="text-fg-3 text-sm">{players.length} players have registered at your arcade</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-elevated border border-stroke rounded-xl text-fg text-sm placeholder-fg-3 focus:outline-none focus:border-red-500 transition-colors w-60"
          />
        </div>
      </div>

      <div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-stroke">
                {['Player', 'Tournaments', 'Last registered', 'Profile'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-fg-3 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-elevated/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-white font-black text-xs">
                              {p.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                        }
                      </div>
                      <div>
                        <p className="text-fg font-semibold text-sm">{p.gamer_tag}</p>
                        <p className="text-fg-3 text-xs">{p.full_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-purple-400 text-sm font-bold">
                      <Trophy className="w-3.5 h-3.5" />
                      {p.tournament_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-3 text-xs">
                    {p.last_registered ? formatDate(p.last_registered, 'short') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/profile/${p.id}`}
                      target="_blank"
                      className="text-fg-3 hover:text-fg-2 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Users className="w-8 h-8 text-fg-3 mx-auto mb-3" />
              <p className="text-fg-3 text-sm">
                {search ? 'No players match your search.' : 'No players have registered at your arcade yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
