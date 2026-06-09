import type { MetadataRoute } from 'next';
import { serverSupabase } from '@/lib/supabase-server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexcade.co.za';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base,                    lastModified: now, changeFrequency: 'daily',  priority: 1   },
    { url: `${base}/tournaments`,   lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/arcades`,       lastModified: now, changeFrequency: 'daily',  priority: 0.8 },
    { url: `${base}/leaderboard`,   lastModified: now, changeFrequency: 'daily',  priority: 0.8 },
    { url: `${base}/live`,          lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${base}/news`,          lastModified: now, changeFrequency: 'daily',  priority: 0.6 },
  ];

  const [{ data: tournaments }, { data: arcades }] = await Promise.all([
    serverSupabase
      .from('tournaments')
      .select('slug')
      .neq('status', 'cancelled'),
    serverSupabase
      .from('arcades')
      .select('slug')
      .eq('is_active', true),
  ]);

  const tournamentPages: MetadataRoute.Sitemap = (tournaments ?? []).map((t) => ({
    url: `${base}/tournaments/${t.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const arcadePages: MetadataRoute.Sitemap = (arcades ?? []).map((a) => ({
    url: `${base}/arcades/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...tournamentPages, ...arcadePages];
}
