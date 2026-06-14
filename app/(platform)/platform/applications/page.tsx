'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatDate } from '@/lib/utils';
import {
  Loader2, ClipboardList, ShieldCheck, XCircle,
  Clock, CheckCircle2,
} from 'lucide-react';

type ApplicationRow = {
  id: string;
  arcade_name: string;
  city: string;
  address: string | null;
  contact_email: string;
  whatsapp_number: string | null;
  games_supported: string[];
  description: string | null;
  console_setup: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  applicant_name: string | null;
  applicant_email: string | null;
};

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

export default function PlatformApplicationsPage() {
  const authState = usePlatformAdmin();
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (authState !== 'ok') return;
    async function load() {
      const { data } = await supabase
        .from('arcade_applications')
        .select('id, arcade_name, city, address, contact_email, whatsapp_number, games_supported, description, console_setup, status, rejection_reason, created_at, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      const rows: ApplicationRow[] = (data ?? []).map((a) => {
        const applicant = (a as any).profiles as { full_name: string; email: string } | null;
        return {
          id: a.id,
          arcade_name: a.arcade_name,
          city: a.city,
          address: a.address,
          contact_email: a.contact_email,
          whatsapp_number: a.whatsapp_number,
          games_supported: a.games_supported ?? [],
          description: a.description,
          console_setup: a.console_setup,
          status: a.status,
          rejection_reason: a.rejection_reason,
          created_at: a.created_at,
          applicant_name: applicant?.full_name ?? null,
          applicant_email: applicant?.email ?? null,
        };
      });

      rows.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setApps(rows);
      setLoading(false);
    }
    load();
  }, [authState]);

  async function approveApplication(appId: string) {
    setActionLoading(`app-${appId}`);
    const { error } = await supabase.rpc('approve_arcade_application', { p_application_id: appId });
    if (!error) setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: 'approved' } : a));
    setActionLoading(null);
  }

  async function rejectApplication(appId: string, reason: string) {
    setActionLoading(`app-${appId}`);
    await supabase.rpc('reject_arcade_application', { p_application_id: appId, p_reason: reason || null });
    setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: 'rejected', rejection_reason: reason || null } : a));
    setRejectModal(null);
    setRejectReason('');
    setActionLoading(null);
  }

  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter);
  const pendingCount = apps.filter((a) => a.status === 'pending').length;

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8">
          <h1 className="font-display text-3xl text-fg mb-1">APPLICATIONS</h1>
          <p className="text-fg-3 text-sm">Review and approve arcade applications.</p>
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-elevated border border-stroke rounded-xl p-1 mb-6 overflow-x-auto">
          {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f ? 'bg-red-600 text-white' : 'text-fg-3 hover:text-fg'
              }`}
            >
              {f === 'pending'  && <Clock className="w-3.5 h-3.5" />}
              {f === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {f === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
              {f === 'all'      && <ClipboardList className="w-3.5 h-3.5" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pendingCount > 0 && (
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  filter === f ? 'bg-white/25 text-white' : 'bg-red-600 text-white'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Application cards */}
        <div className="flex flex-col gap-4">
          {filtered.length === 0 && (
            <div className="bg-surface border border-stroke rounded-2xl p-12 text-center">
              <ClipboardList className="w-8 h-8 text-fg-3 mx-auto mb-3" />
              <p className="text-fg-3 text-sm">No {filter === 'all' ? '' : filter} applications.</p>
            </div>
          )}

          {filtered.map((a) => (
            <div key={a.id} className="bg-surface border border-stroke rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      a.status === 'pending'  ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                      a.status === 'approved' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                                                'text-red-400 bg-red-400/10 border-red-400/20'
                    }`}>
                      {a.status === 'pending'  && <Clock className="w-3 h-3" />}
                      {a.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                      {a.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </span>
                    <span className="text-fg-3 text-xs">{formatDate(a.created_at, 'short')}</span>
                  </div>
                  <h3 className="text-fg font-bold text-lg">{a.arcade_name}</h3>
                  <p className="text-fg-2 text-sm">{a.city}{a.address ? ` · ${a.address}` : ''}</p>
                </div>

                {a.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => approveApplication(a.id)}
                      disabled={actionLoading === `app-${a.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {actionLoading === `app-${a.id}`
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <ShieldCheck className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                    <button
                      onClick={() => { setRejectModal({ id: a.id, name: a.arcade_name }); setRejectReason(''); }}
                      disabled={actionLoading === `app-${a.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-elevated rounded-xl p-3">
                  <p className="text-fg-3 mb-0.5">Applicant</p>
                  <p className="text-fg-2 font-semibold truncate">{a.applicant_name ?? '—'}</p>
                  <p className="text-fg-3 truncate">{a.applicant_email ?? '—'}</p>
                </div>
                <div className="bg-elevated rounded-xl p-3">
                  <p className="text-fg-3 mb-0.5">Contact</p>
                  <p className="text-fg-2 truncate">{a.contact_email}</p>
                  {a.whatsapp_number && <p className="text-fg-3">{a.whatsapp_number}</p>}
                </div>
                <div className="bg-elevated rounded-xl p-3 col-span-2">
                  <p className="text-fg-3 mb-1">Games supported</p>
                  <div className="flex flex-wrap gap-1">
                    {a.games_supported.map((g) => (
                      <span key={g} className="px-1.5 py-0.5 bg-surface border border-stroke rounded text-fg-2">{g}</span>
                    ))}
                  </div>
                </div>
              </div>

              {(a.description || a.console_setup) && (
                <div className="text-xs text-fg-3 border-t border-stroke pt-3 flex flex-col gap-1">
                  {a.description  && <p><span className="text-fg-2 font-semibold">About: </span>{a.description}</p>}
                  {a.console_setup && <p><span className="text-fg-2 font-semibold">Setup: </span>{a.console_setup}</p>}
                </div>
              )}

              {a.status === 'rejected' && a.rejection_reason && (
                <div className="text-xs text-red-400 border-t border-stroke pt-3">
                  <span className="font-semibold">Rejection reason: </span>{a.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-stroke rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-fg text-lg mb-1">Reject application</h3>
            <p className="text-fg-3 text-sm mb-5">
              Rejecting <span className="text-fg font-semibold">{rejectModal.name}</span>. Optionally add a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason (optional — the applicant will see this)"
              className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-stroke text-fg text-sm placeholder-fg-3 focus:outline-none focus:border-red-500 transition-colors resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => rejectApplication(rejectModal.id, rejectReason)}
                disabled={actionLoading === `app-${rejectModal.id}`}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === `app-${rejectModal.id}` && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm reject
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
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
