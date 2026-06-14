'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatDate } from '@/lib/utils';
import {
  Loader2, Building2, ShieldCheck, ShieldOff,
  ExternalLink, Search,
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

type ConfirmModal = { id: string; name: string; action: 'suspend' | 'activate' };

export default function PlatformArcadesPage() {
  const authState = usePlatformAdmin();
  const [arcades, setArcades] = useState<ArcadeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);

  useEffect(() => {
    if (authState !== 'ok') return;
    async function load() {
      const { data: arcadeData } = await supabase
        .from('arcades')
        .select('id, name, city, slug, is_active, created_at, owner_id, profiles!owner_id(full_name, email)')
        .order('created_at', { ascending: false });

      const { data: tourneyData } = await supabase
        .from('tournaments')
        .select('id, arcade_id');

      const tourneyCountMap: Record<string, number> = {};
      for (const t of (tourneyData ?? [])) {
        tourneyCountMap[t.arcade_id] = (tourneyCountMap[t.arcade_id] ?? 0) + 1;
      }

      const rows: ArcadeRow[] = (arcadeData ?? []).map((a) => {
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
      });

      setArcades(rows);
      setLoading(false);
    }
    load();
  }, [authState]);

  async function setArcadeActive(arcadeId: string, active: boolean) {
    setActionLoading(`arcade-${arcadeId}`);
    await supabase.from('arcades').update({ is_active: active }).eq('id', arcadeId);
    setArcades((prev) => prev.map((a) => a.id === arcadeId ? { ...a, is_active: active } : a));
    setConfirmModal(null);
    setActionLoading(null);
  }

  const filtered = arcades.filter((a) =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase()) ||
    (a.owner_full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (authState === 'loading' || (authState === 'ok' && loading)) {
    return (
      <PlatformShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-fg-3 animate-spin" />
        </div>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-fg mb-1">ARCADES</h1>
            <p className="text-fg-3 text-sm">{arcades.length} registered</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search arcades…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-elevated border border-stroke rounded-xl text-fg text-sm placeholder-fg-3 focus:outline-none focus:border-red-500 transition-colors w-64"
            />
          </div>
        </div>

        <div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-stroke">
                  {['Arcade', 'Owner', 'City', 'Tournaments', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-fg-3 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-fg font-semibold text-sm">{a.name}</p>
                      <Link
                        href={`/arcades/${a.slug}`}
                        target="_blank"
                        className="text-fg-3 text-xs hover:text-fg-2 transition-colors inline-flex items-center gap-1"
                      >
                        /arcades/{a.slug}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-fg-2 text-xs">{a.owner_full_name ?? '—'}</p>
                      <p className="text-fg-3 text-xs">{a.owner_email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-fg-3 text-xs">{a.city}</td>
                    <td className="px-4 py-3 text-fg-3 text-xs">{a.tournament_count}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        a.is_active
                          ? 'text-green-400 bg-green-400/10 border-green-400/20'
                          : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                      }`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg-3 text-xs">{formatDate(a.created_at, 'short')}</td>
                    <td className="px-4 py-3">
                      {a.is_active ? (
                        <button
                          onClick={() => setConfirmModal({ id: a.id, name: a.name, action: 'suspend' })}
                          disabled={actionLoading === `arcade-${a.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 text-yellow-400 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {actionLoading === `arcade-${a.id}`
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <ShieldOff className="w-3 h-3" />}
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ id: a.id, name: a.name, action: 'activate' })}
                          disabled={actionLoading === `arcade-${a.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {actionLoading === `arcade-${a.id}`
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <ShieldCheck className="w-3 h-3" />}
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-10 text-center">
                <Building2 className="w-8 h-8 text-fg-3 mx-auto mb-3" />
                <p className="text-fg-3 text-sm">{search ? 'No arcades match your search.' : 'No arcades registered yet.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-stroke rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-fg text-lg mb-1">
              {confirmModal.action === 'suspend' ? 'Suspend arcade?' : 'Activate arcade?'}
            </h3>
            <p className="text-fg-3 text-sm mb-6">
              {confirmModal.action === 'suspend'
                ? `Suspending "${confirmModal.name}" will hide it from the platform until reactivated.`
                : `Activating "${confirmModal.name}" will make it publicly visible on the platform.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setArcadeActive(confirmModal.id, confirmModal.action === 'activate')}
                disabled={actionLoading === `arcade-${confirmModal.id}`}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  confirmModal.action === 'suspend'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-60`}
              >
                {actionLoading === `arcade-${confirmModal.id}` && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmModal.action === 'suspend' ? 'Yes, suspend' : 'Yes, activate'}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-elevated hover:bg-stroke text-fg-2 font-bold text-sm transition-colors"
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
