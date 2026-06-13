'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatDate } from '@/lib/utils';
import {
  Loader2, AlertCircle, ShieldCheck, ShieldOff, ExternalLink,
} from 'lucide-react';

type ArcadeRow = {
  id: string;
  name: string;
  city: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  owner_full_name: string | null;
  owner_email: string | null;
  tournament_count: number;
};

export default function PlatformArcadesPage() {
  const auth = usePlatformAdmin();
  const [arcades, setArcades] = useState<ArcadeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; name: string; makeActive: boolean } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (auth !== 'ok') return;
    load();
  }, [auth]);

  async function load() {
    const [{ data: arcadeData }, { data: tourneyData }] = await Promise.all([
      supabase
        .from('arcades')
        .select('id, name, city, slug, is_active, created_at, profiles!owner_id(full_name, email)')
        .order('created_at', { ascending: false }),
      supabase.from('tournaments').select('id, arcade_id'),
    ]);

    const tourneyCountMap: Record<string, number> = {};
    for (const t of (tourneyData ?? [])) {
      tourneyCountMap[t.arcade_id] = (tourneyCountMap[t.arcade_id] ?? 0) + 1;
    }

    setArcades(
      (arcadeData ?? []).map((a) => {
        const owner = (a as any).profiles as { full_name: string; email: string } | null;
        return {
          id: a.id,
          name: a.name,
          city: a.city,
          slug: a.slug,
          is_active: a.is_active,
          created_at: a.created_at,
          owner_full_name: owner?.full_name ?? null,
          owner_email: owner?.email ?? null,
          tournament_count: tourneyCountMap[a.id] ?? 0,
        };
      }),
    );
    setLoading(false);
  }

  async function toggleActive(arcadeId: string, makeActive: boolean) {
    setActionLoading(`arcade-${arcadeId}`);
    await supabase.from('arcades').update({ is_active: makeActive }).eq('id', arcadeId);
    setArcades((prev) =>
      prev.map((a) => a.id === arcadeId ? { ...a, is_active: makeActive } : a),
    );
    setConfirmModal(null);
    setActionLoading(null);
  }

  const filtered = search
    ? arcades.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.city.toLowerCase().includes(search.toLowerCase()),
      )
    : arcades;

  if (auth === 'loading' || (auth === 'ok' && loading)) {
    return (
      <PlatformShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        </div>
      </PlatformShell>
    );
  }

  if (auth === 'denied') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
    );
  }

  const activeCount = arcades.filter((a) => a.is_active).length;

  return (
    <PlatformShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-white">ARCADES</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {arcades.length} total · {activeCount} active
            </p>
          </div>
          <input
            type="search"
            placeholder="Search arcades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors w-60"
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Arcade', 'Owner', 'City', 'Tournaments', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-semibold text-sm">{a.name}</p>
                      <Link
                        href={`/arcades/${a.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 text-zinc-600 text-xs hover:text-zinc-400 transition-colors"
                      >
                        View public <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-300 text-xs">{a.owner_full_name ?? '—'}</p>
                      <p className="text-zinc-600 text-xs">{a.owner_email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{a.city}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{a.tournament_count}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        a.is_active
                          ? 'text-green-400 bg-green-400/10 border-green-400/20'
                          : 'text-zinc-500 bg-zinc-800 border-zinc-700'
                      }`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-xs whitespace-nowrap">
                      {formatDate(a.created_at, 'short')}
                    </td>
                    <td className="px-4 py-3">
                      {a.is_active ? (
                        <button
                          onClick={() => setConfirmModal({ id: a.id, name: a.name, makeActive: false })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 text-yellow-400 text-xs font-semibold transition-all"
                        >
                          <ShieldOff className="w-3 h-3" />
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ id: a.id, name: a.name, makeActive: true })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-xs font-semibold transition-all"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-10 text-center text-zinc-500 text-sm">
                {search ? 'No arcades match your search.' : 'No arcades registered yet.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suspend / activate confirmation modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white text-lg mb-2">
              {confirmModal.makeActive ? 'Activate' : 'Suspend'} arcade?
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              {confirmModal.makeActive
                ? `${confirmModal.name} will become visible to players.`
                : `${confirmModal.name} will be hidden from players and its tournaments won't appear publicly.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => toggleActive(confirmModal.id, confirmModal.makeActive)}
                disabled={actionLoading === `arcade-${confirmModal.id}`}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-colors flex items-center justify-center gap-2 ${
                  confirmModal.makeActive
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                } disabled:opacity-60`}
              >
                {actionLoading === `arcade-${confirmModal.id}` && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm {confirmModal.makeActive ? 'activate' : 'suspend'}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PlatformShell>
  );
}
