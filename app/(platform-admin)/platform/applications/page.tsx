'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatDate } from '@/lib/utils';
import {
  Loader2, AlertCircle, ClipboardList, Clock,
  CheckCircle2, XCircle, ShieldCheck,
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
  const auth = usePlatformAdmin();
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (auth !== 'ok') return;
    load();
  }, [auth]);

  async function load() {
    const { data } = await supabase
      .from('arcade_applications')
      .select('id, arcade_name, city, address, contact_email, whatsapp_number, games_supported, description, console_setup, status, rejection_reason, created_at, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    const rows: ApplicationRow[] = (data ?? []).map((a) => {
      const profile = (a as any).profiles as { full_name: string; email: string } | null;
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
        applicant_name: profile?.full_name ?? null,
        applicant_email: profile?.email ?? null,
      };
    });

    // Sort: pending first, then by date desc
    rows.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setApps(rows);
    setLoading(false);
  }

  async function approve(appId: string) {
    setActionLoading(`app-${appId}`);
    const { error } = await supabase.rpc('approve_arcade_application', { p_application_id: appId });
    if (!error) {
      setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: 'approved' } : a));
    }
    setActionLoading(null);
  }

  async function reject(appId: string, reason: string) {
    setActionLoading(`app-${appId}`);
    await supabase.rpc('reject_arcade_application', { p_application_id: appId, p_reason: reason || null });
    setApps((prev) =>
      prev.map((a) => a.id === appId ? { ...a, status: 'rejected', rejection_reason: reason || null } : a),
    );
    setRejectModal(null);
    setRejectReason('');
    setActionLoading(null);
  }

  const pendingCount = apps.filter((a) => a.status === 'pending').length;
  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter);

  const FILTERS: { id: StatusFilter; label: string }[] = [
    { id: 'pending',  label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all',      label: 'All' },
  ];

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

  return (
    <PlatformShell pendingCount={pendingCount}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-white">APPLICATIONS</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Arcade registration requests</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6 w-fit flex-wrap">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === id ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <ClipboardList className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">
              No {filter === 'all' ? '' : filter} applications.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((a) => (
              <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
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
                      <span className="text-zinc-600 text-xs">{formatDate(a.created_at, 'short')}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg">{a.arcade_name}</h3>
                    <p className="text-zinc-400 text-sm">
                      {a.city}{a.address ? ` · ${a.address}` : ''}
                    </p>
                  </div>

                  {a.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => approve(a.id)}
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
                  <div className="bg-zinc-800/60 rounded-xl p-3">
                    <p className="text-zinc-500 mb-0.5">Applicant</p>
                    <p className="text-zinc-200 font-semibold truncate">{a.applicant_name ?? '—'}</p>
                    <p className="text-zinc-500 truncate">{a.applicant_email ?? '—'}</p>
                  </div>
                  <div className="bg-zinc-800/60 rounded-xl p-3">
                    <p className="text-zinc-500 mb-0.5">Contact</p>
                    <p className="text-zinc-200 truncate">{a.contact_email}</p>
                    {a.whatsapp_number && <p className="text-zinc-500">{a.whatsapp_number}</p>}
                  </div>
                  <div className="bg-zinc-800/60 rounded-xl p-3 col-span-2">
                    <p className="text-zinc-500 mb-1">Games</p>
                    <div className="flex flex-wrap gap-1">
                      {a.games_supported.map((g) => (
                        <span key={g} className="px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {(a.description || a.console_setup) && (
                  <div className="text-xs text-zinc-500 border-t border-zinc-800 pt-3 flex flex-col gap-1">
                    {a.description && (
                      <p><span className="text-zinc-400 font-semibold">About: </span>{a.description}</p>
                    )}
                    {a.console_setup && (
                      <p><span className="text-zinc-400 font-semibold">Setup: </span>{a.console_setup}</p>
                    )}
                  </div>
                )}

                {a.status === 'rejected' && a.rejection_reason && (
                  <div className="text-xs text-red-400 border-t border-zinc-800 pt-3">
                    <span className="font-semibold">Rejection reason: </span>{a.rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-white text-lg mb-1">Reject application</h3>
            <p className="text-zinc-400 text-sm mb-5">
              Rejecting <span className="text-white font-semibold">{rejectModal.name}</span>.
              Optionally add a reason — the applicant will see this.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason (optional)"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => reject(rejectModal.id, rejectReason)}
                disabled={actionLoading === `app-${rejectModal.id}`}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === `app-${rejectModal.id}` && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm reject
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
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
