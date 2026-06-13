'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlatformAdmin } from '@/lib/usePlatformAdmin';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { formatDate } from '@/lib/utils';
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react';

type UserRow = {
  id: string;
  full_name: string;
  gamer_tag: string;
  email: string;
  role: string;
  created_at: string;
};

const ROLE_STYLE: Record<string, string> = {
  player:         'text-zinc-400 bg-zinc-800 border-zinc-700',
  arcade_owner:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
  platform_admin: 'text-red-400 bg-red-400/10 border-red-400/20',
};

function roleLabel(role: string) {
  if (role === 'platform_admin') return 'Platform Admin';
  if (role === 'arcade_owner')   return 'Arcade Owner';
  return 'Player';
}

export default function PlatformUsersPage() {
  const auth = usePlatformAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRole, setConfirmRole] = useState<{ userId: string; name: string; role: string } | null>(null);

  useEffect(() => {
    if (auth !== 'ok') return;
    load();
  }, [auth]);

  async function load() {
    const [{ data: userData }, { data: { user } }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, gamer_tag, email, role, created_at')
        .order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setUsers((userData ?? []) as UserRow[]);
    setCurrentUserId(user?.id ?? null);
    setLoading(false);
  }

  async function changeRole(userId: string, role: string) {
    setActionLoading(`user-${userId}`);
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    setConfirmRole(null);
    setActionLoading(null);
  }

  const filtered = search
    ? users.filter(
        (u) =>
          u.gamer_tag.toLowerCase().includes(search.toLowerCase()) ||
          u.full_name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

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
    <PlatformShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-white">USERS</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{users.length} registered</p>
          </div>
          <input
            type="search"
            placeholder="Search by name, tag, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors w-72"
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Player', 'Email', 'Role', 'Joined', 'Change Role'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((u) => {
                  const isSelf     = u.id === currentUserId;
                  const isAdmin    = u.role === 'platform_admin';
                  return (
                    <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-zinc-200 font-semibold text-sm">{u.gamer_tag}</p>
                        <p className="text-zinc-500 text-xs">{u.full_name}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${ROLE_STYLE[u.role] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                            {roleLabel(u.role)}
                          </span>
                          {isSelf && <span className="text-[10px] text-zinc-600">(you)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 text-xs whitespace-nowrap">
                        {formatDate(u.created_at, 'short')}
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-zinc-600 text-xs">Cannot change own role</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(['player', 'arcade_owner', 'platform_admin'] as const).map((role) => {
                              const isDangerous = role === 'platform_admin' || isAdmin;
                              const isCurrent   = u.role === role;
                              return (
                                <button
                                  key={role}
                                  onClick={() => {
                                    if (isDangerous) {
                                      setConfirmRole({ userId: u.id, name: u.gamer_tag, role });
                                    } else {
                                      changeRole(u.id, role);
                                    }
                                  }}
                                  disabled={isCurrent || actionLoading === `user-${u.id}`}
                                  className={`px-2 py-1 rounded-lg border text-xs font-semibold transition-all disabled:cursor-not-allowed ${
                                    isCurrent
                                      ? 'bg-zinc-700 border-zinc-600 text-zinc-300 opacity-60'
                                      : isDangerous
                                      ? 'bg-red-900/20 border-red-800/30 text-red-400 hover:bg-red-900/40'
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  {actionLoading === `user-${u.id}` && !isCurrent
                                    ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                                    : null}
                                  {role === 'player' ? 'Player' : role === 'arcade_owner' ? 'Owner' : 'Admin'}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-10 text-center text-zinc-500 text-sm">No users found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Dangerous role change confirmation */}
      {confirmRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mb-3" />
            <h3 className="font-bold text-white text-lg mb-2">Confirm role change</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Set <span className="text-white font-semibold">{confirmRole.name}</span> as{' '}
              <span className="text-white font-semibold">{roleLabel(confirmRole.role)}</span>
              {confirmRole.role === 'platform_admin'
                ? ' — this grants full platform access.'
                : ' — this removes their current elevated access.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => changeRole(confirmRole.userId, confirmRole.role)}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
              <button
                onClick={() => setConfirmRole(null)}
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
