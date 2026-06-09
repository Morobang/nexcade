'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Loader2, AlertCircle, ArrowLeft, Tv, Radio,
  CircleStop, Info, ExternalLink, Gamepad2, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Arcade = { id: string; name: string };

type Tournament = {
  id: string;
  name: string;
  game_type: string;
  status: string;
  is_streamed: boolean;
  stream_url: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const GAME_COLOR: Record<string, string> = {
  FC26:    'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Tekken8: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  SF6:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  MK1:     'text-pink-400 bg-pink-400/10 border-pink-400/20',
  KOFXV:   'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
  Naruto:  'text-green-400 bg-green-400/10 border-green-400/20',
};

function toEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  for (const pattern of [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/live\/([^?&\s]+)/,
  ]) {
    const m = url.match(pattern);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
  }
  return url;
}

function isValidYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminStreamPage() {
  const router = useRouter();
  const [arcade, setArcade] = useState<Arcade | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Form state
  const [selectedId, setSelectedId] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTournaments = useCallback(async (arcadeId: string) => {
    const { data } = await supabase
      .from('tournaments')
      .select('id, name, game_type, status, is_streamed, stream_url')
      .eq('arcade_id', arcadeId)
      .in('status', ['open', 'full', 'live'])
      .order('start_at', { ascending: false });
    setTournaments(data ?? []);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (!profile || !['arcade_owner', 'platform_admin'].includes(profile.role)) {
        setUnauthorized(true); setLoading(false); return;
      }

      const { data: arcadeData } = await supabase
        .from('arcades').select('id, name').eq('owner_id', user.id).single();

      if (!arcadeData) { setUnauthorized(true); setLoading(false); return; }

      setArcade(arcadeData);
      await loadTournaments(arcadeData.id);
      setLoading(false);
    }
    init();
  }, [router, loadTournaments]);

  // Pre-fill stream URL when selecting a tournament that already has one
  function handleSelectTournament(id: string) {
    setSelectedId(id);
    setError(null);
    const t = tournaments.find((t) => t.id === id);
    if (t?.stream_url) setStreamUrl(t.stream_url);
    else setStreamUrl('');
  }

  async function goLive() {
    if (!selectedId) return setError('Select a tournament to stream.');
    if (!streamUrl.trim()) return setError('Enter a YouTube stream URL.');
    if (!isValidYouTubeUrl(streamUrl)) return setError('Please enter a valid YouTube URL.');

    setActionLoading('go-live');
    setError(null);
    const { error: err } = await supabase
      .from('tournaments')
      .update({ status: 'live', is_streamed: true, stream_url: streamUrl.trim() })
      .eq('id', selectedId);

    if (err) { setError(err.message); setActionLoading(null); return; }

    await loadTournaments(arcade!.id);
    setSelectedId('');
    setStreamUrl('');
    setActionLoading(null);
  }

  async function endStream(tournamentId: string) {
    setActionLoading(`end-${tournamentId}`);
    await supabase
      .from('tournaments')
      .update({ status: 'open', is_streamed: false, stream_url: null })
      .eq('id', tournamentId);
    await loadTournaments(arcade!.id);
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-white mb-2">ACCESS DENIED</h1>
          <p className="text-zinc-400 text-sm mb-6">This area is for arcade owners only.</p>
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">Back to home</Link>
        </div>
      </div>
    );
  }

  const liveTournaments = tournaments.filter((t) => t.status === 'live');
  const streamableTournaments = tournaments.filter((t) => t.status !== 'live');
  const embedUrl = streamUrl ? toEmbedUrl(streamUrl) : '';
  const selectedTourney = tournaments.find((t) => t.id === selectedId);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to admin
        </Link>
        <span className="text-zinc-700">/</span>
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">{arcade!.name}</p>
          <h1 className="font-display text-3xl text-white leading-none">STREAM CONTROLS</h1>
        </div>
      </div>

      {/* Currently live */}
      {liveTournaments.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="relative flex w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-red-500" />
            </span>
            Now Live
          </h2>
          <div className="flex flex-col gap-4">
            {liveTournaments.map((t) => {
              const embed = t.stream_url ? toEmbedUrl(t.stream_url) : null;
              return (
                <div key={t.id} className="bg-zinc-900 border border-red-500/30 rounded-2xl overflow-hidden">
                  {/* Live badge bar */}
                  <div className="h-1 w-full bg-red-600" />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border mb-1 ${GAME_COLOR[t.game_type] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                          {t.game_type}
                        </span>
                        <p className="text-white font-bold">{t.name}</p>
                        {t.stream_url && (
                          <a
                            href={t.stream_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs mt-0.5 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {t.stream_url.length > 50 ? t.stream_url.slice(0, 50) + '…' : t.stream_url}
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => endStream(t.id)}
                        disabled={actionLoading === `end-${t.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shrink-0"
                      >
                        {actionLoading === `end-${t.id}`
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CircleStop className="w-4 h-4" />}
                        End Stream
                      </button>
                    </div>

                    {/* YouTube preview */}
                    {embed && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-800">
                        <iframe
                          src={embed}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={`Live stream — ${t.name}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Go Live form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
          <Tv className="w-5 h-5 text-red-500" />
          <h2 className="font-bold text-white text-sm uppercase tracking-wider">Go Live</h2>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Tournament selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Tournament
            </label>
            {streamableTournaments.length === 0 ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm bg-zinc-800 rounded-xl px-4 py-3 border border-zinc-700">
                <Gamepad2 className="w-4 h-4" />
                {tournaments.length === 0
                  ? 'No tournaments found. Create one first.'
                  : 'All tournaments are currently live.'}
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => handleSelectTournament(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors text-sm"
              >
                <option value="">Select a tournament…</option>
                {streamableTournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.game_type}] {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Stream URL */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              YouTube Stream URL
            </label>
            <input
              type="url"
              value={streamUrl}
              onChange={(e) => { setStreamUrl(e.target.value); setError(null); }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
            />
          </div>

          {/* Instructions accordion */}
          <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInstructions((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                <Info className="w-4 h-4" />
                How to get your YouTube stream URL
              </span>
              {showInstructions
                ? <ChevronUp className="w-4 h-4 text-zinc-600" />
                : <ChevronDown className="w-4 h-4 text-zinc-600" />}
            </button>
            {showInstructions && (
              <div className="px-4 pb-4 text-xs text-zinc-400 space-y-2 border-t border-zinc-700/60 pt-3">
                <p className="font-semibold text-zinc-300">Option A — YouTube Live (recommended)</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-500">
                  <li>Open <span className="text-zinc-300">YouTube Studio</span> and go to <span className="text-zinc-300">Go Live</span></li>
                  <li>Start your stream — copy the page URL from your browser</li>
                  <li>Paste the full YouTube URL here — we handle the rest</li>
                </ol>
                <p className="font-semibold text-zinc-300 pt-1">Option B — Existing YouTube video or premiere</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-500">
                  <li>Open the video on YouTube</li>
                  <li>Copy the URL from your browser (e.g. <span className="text-zinc-300 font-mono">youtube.com/watch?v=abc123</span>)</li>
                  <li>Paste it here</li>
                </ol>
                <p className="text-zinc-600 pt-1">Accepted formats: youtube.com/watch, youtu.be, youtube.com/live</p>
              </div>
            )}
          </div>

          {/* Preview */}
          {embedUrl && selectedTourney && (
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Preview</p>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-800">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Stream preview"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Go Live button */}
          <button
            onClick={goLive}
            disabled={!!actionLoading || streamableTournaments.length === 0}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-colors text-sm"
          >
            {actionLoading === 'go-live'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Radio className="w-4 h-4" />}
            {actionLoading === 'go-live' ? 'Going Live…' : 'Go Live'}
          </button>

        </div>
      </div>
    </div>
  );
}
