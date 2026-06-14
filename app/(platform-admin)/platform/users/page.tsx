'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatDate } from '@/lib/utils';
import { Loader2, Users, Search, ShieldCheck } from 'lucide-react';

type UserRow = {
  id: string;
  full_name: string;
  gamer_tag: string;
  email: string;
  role: string;
  created_at: string;
};

type ConfirmModal = {
  userId: string;
  gamerTag: string;
  newRole: string;
  isSelf: boolean;
};

const ROLE_STYLE: Record<string, string> = {
  player:         'text-fg-3 bg-elevated border-stroke',
  arcade_owner:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
  platform_admin: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const ROLE_LABEL: Record<string, string> = {
  player:         'Player',
  arcade_owner:   'Arcade Owner',
  platform_admin: 'Platform Admin',
};

export default function PlatformUsersPage() {
  const authState = usePlatformAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);

  useEffect(() => {
    if (authState !== 'ok') return;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setSelfId(user?.id ?? null);

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, gamer_tag, email, role, created_at')
        .order('created_at', { ascending: false });

      setUsers((data ?? []) as UserRow[]);
      setLoading(false);
    }
    load();
  }, [authState]);

  async function changeRole(userId: string, role: string) {
    setActionLoading(`user-${userId}`);
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    setConfirmModal(null);
    setActionLoading(null);
  }

  function requestRoleChange(u: UserRow, newRole: string) {
    setConfirmModal({
      userId: u.id,
      gamerTag: u.gamer_tag,
      newRole,
      isSelf: u.id === selfId,
    });
  }

  const filtered = users.filter((u) =>
    !search ||
    u.gamer_tag.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
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

  const isDangerous = (newRole: string, currentRole: string) =>
    newRole === 'platform_admin' || currentRole === 'platform_admin';

  return (
    <PlatformShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-fg mb-1">USERS</h1>
            <p className="text-fg-3 text-sm">{users.length} registered</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users…"
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
                  {['Player', 'Email', 'Role', 'Joined', 'Change Role'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-fg-3 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-fg font-semibold text-sm">{u.gamer_tag}</p>
                      <p className="text-fg-3 text-xs">{u.full_name}</p>
                    </td>
                    <td className="px-4 py-3 text-fg-3 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${ROLE_STYLE[u.role] ?? 'text-fg-3 bg-elevated border-stroke'}`}>
                        {u.role === 'platform_admin' && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg-3 text-xs">{formatDate(u.created_at, 'short')}</td>
                    <td className="px-4 py-3">
                      {u.id === selfId ? (
                        <span className="text-fg-3 text-xs italic">Cannot change own role</span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(['player', 'arcade_owner', 'platform_admin'] as const).map((role) => (
                            <button
                              key={role}
                              onClick={() => requestRoleChange(u, role)}
                              disabled={u.role === role || actionLoading === `user-${u.id}`}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                u.role === role
                                  ? 'bg-elevated border-stroke text-fg-2'
                                  : 'bg-elevated border-stroke text-fg-3 hover:border-fg-2 hover:text-fg-2'
                              }`}
                            >
                              {actionLoading === `user-${u.id}`
                                ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                                : null}
                              {ROLE_LABEL[role]}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-10 text-center">
                <Users className="w-8 h-8 text-fg-3 mx-auto mb-3" />
                <p className="text-fg-3 text-sm">{search ? 'No users match your search.' : 'No users found.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-stroke rounded-2xl p-6 w-full max-w-sm">
            {confirmModal.isSelf ? (
              <>
                <h3 className="font-bold text-fg text-lg mb-2">Cannot change own role</h3>
                <p className="text-fg-3 text-sm mb-5">You cannot change your own platform admin role.</p>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="w-full py-2.5 rounded-xl bg-elevated text-fg-2 font-bold text-sm"
                >
                  Close
                </button>
              </>
            ) : isDangerous(confirmModal.newRole, users.find((u) => u.id === confirmModal.userId)?.role ?? '') ? (
              <>
                <h3 className="font-bold text-fg text-lg mb-2">
                  {confirmModal.newRole === 'platform_admin' ? 'Grant platform admin?' : 'Remove platform admin?'}
                </h3>
                <p className="text-fg-3 text-sm mb-5">
                  {confirmModal.newRole === 'platform_admin'
                    ? `This will give ${confirmModal.gamerTag} full platform admin access. This is a high-trust role.`
                    : `This will remove platform admin access from ${confirmModal.gamerTag}.`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => changeRole(confirmModal.userId, confirmModal.newRole)}
                    disabled={actionLoading === `user-${confirmModal.userId}`}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading === `user-${confirmModal.userId}` && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-elevated hover:bg-stroke text-fg-2 font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold text-fg text-lg mb-2">Change role?</h3>
                <p className="text-fg-3 text-sm mb-5">
                  Set <span className="text-fg font-semibold">{confirmModal.gamerTag}</span> to{' '}
                  <span className="text-fg font-semibold">{ROLE_LABEL[confirmModal.newRole]}</span>.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => changeRole(confirmModal.userId, confirmModal.newRole)}
                    disabled={actionLoading === `user-${confirmModal.userId}`}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading === `user-${confirmModal.userId}` && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-elevated hover:bg-stroke text-fg-2 font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </PlatformShell>
  );
}
