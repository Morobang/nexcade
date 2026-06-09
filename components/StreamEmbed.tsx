'use client';

import { useEffect, useState } from 'react';
import { Tv, ExternalLink } from 'lucide-react';

type Platform = 'youtube' | 'twitch' | 'facebook' | 'discord' | 'instagram' | 'tiktok' | 'unknown';

function detectPlatform(url: string): Platform {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes('youtube.com') || h === 'youtu.be') return 'youtube';
    if (h.includes('twitch.tv')) return 'twitch';
    if (h.includes('facebook.com') || h === 'fb.watch') return 'facebook';
    if (h.includes('discord.gg') || h.includes('discord.com')) return 'discord';
    if (h.includes('instagram.com')) return 'instagram';
    if (h.includes('tiktok.com')) return 'tiktok';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function toEmbedUrl(url: string, hostname: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}?autoplay=1&rel=0`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}?autoplay=1&rel=0`;
    }
    if (u.hostname.includes('twitch.tv')) {
      const channel = u.pathname.replace(/^\//, '');
      return `https://player.twitch.tv/?channel=${channel}&parent=${hostname}&autoplay=true&muted=true`;
    }
    return null;
  } catch {
    return null;
  }
}

const PLATFORM_META: Record<Platform, { label: string; color: string; bg: string; border: string }> = {
  youtube:   { label: 'YouTube',   color: 'text-white',        bg: 'bg-red-600 hover:bg-red-700',            border: 'border-red-700'     },
  twitch:    { label: 'Twitch',    color: 'text-white',        bg: 'bg-purple-600 hover:bg-purple-700',       border: 'border-purple-700'  },
  facebook:  { label: 'Facebook',  color: 'text-white',        bg: 'bg-blue-600 hover:bg-blue-700',           border: 'border-blue-700'    },
  discord:   { label: 'Discord',   color: 'text-white',        bg: 'bg-indigo-600 hover:bg-indigo-700',       border: 'border-indigo-700'  },
  instagram: { label: 'Instagram', color: 'text-white',        bg: 'bg-pink-600 hover:bg-pink-700',           border: 'border-pink-700'    },
  tiktok:    { label: 'TikTok',    color: 'text-white',        bg: 'bg-zinc-800 hover:bg-zinc-700',           border: 'border-zinc-600'    },
  unknown:   { label: 'platform',  color: 'text-zinc-200',     bg: 'bg-zinc-800 hover:bg-zinc-700',           border: 'border-zinc-700'    },
};

interface Props {
  url: string;
  title?: string;
}

export function StreamEmbed({ url, title = 'Live stream' }: Props) {
  const [embedUrl, setEmbedUrl] = useState<string | null | undefined>(undefined);
  const platform = detectPlatform(url);
  const meta = PLATFORM_META[platform];

  useEffect(() => {
    setEmbedUrl(toEmbedUrl(url, window.location.hostname));
  }, [url]);

  // Loading state
  if (embedUrl === undefined) {
    return (
      <div className="w-full aspect-video bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800">
        <div className="text-center">
          <Tv className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-600 text-sm">Loading stream…</p>
        </div>
      </div>
    );
  }

  // Embeddable — YouTube or Twitch
  if (embedUrl) {
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-950">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          title={title}
        />
      </div>
    );
  }

  // Non-embeddable — Facebook, Discord, Instagram, TikTok, etc.
  return (
    <div className="w-full aspect-video bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-5 px-8 text-center">
      <Tv className="w-10 h-10 text-zinc-600" />
      <div>
        <p className="text-white font-bold text-lg mb-1">{title}</p>
        <p className="text-zinc-500 text-sm">
          This stream is live on {meta.label}. Tap the button below to watch.
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-colors ${meta.bg} ${meta.color}`}
      >
        <ExternalLink className="w-4 h-4" />
        Watch on {meta.label}
      </a>
    </div>
  );
}
