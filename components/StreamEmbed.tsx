'use client';

import { useEffect, useState } from 'react';
import { Tv } from 'lucide-react';

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
    // Already an embed URL or unknown — use as-is
    return url;
  } catch {
    return null;
  }
}

interface Props {
  url: string;
  title?: string;
}

export function StreamEmbed({ url, title = 'Live stream' }: Props) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    setEmbedUrl(toEmbedUrl(url, window.location.hostname));
  }, [url]);

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800">
        <div className="text-center">
          <Tv className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-600 text-sm">Loading stream…</p>
        </div>
      </div>
    );
  }

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
