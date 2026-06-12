import type { Metadata } from 'next';
import { serverSupabase } from '@/lib/supabase-server';
import { ArcadeDiscovery } from '@/components/ArcadeDiscovery';
import { ArcadeApplyButton } from '@/components/PageRoleCTAs';

export const metadata: Metadata = {
  title: 'Arcades',
  description: 'Find gaming arcades across South Africa hosting NexCade tournaments.',
};

export default async function ArcadesPage() {
  const [{ data: arcades }, { data: nextTournaments }] = await Promise.all([
    serverSupabase
      .from('arcades')
      .select('id, name, slug, city, description, games_supported, latitude, longitude')
      .eq('is_active', true)
      .order('name'),
    serverSupabase
      .from('tournaments')
      .select('arcade_id, name, start_at')
      .in('status', ['open', 'live'])
      .order('start_at', { ascending: true }),
  ]);

  // Attach the next upcoming tournament to each arcade
  const nextByArcade = (nextTournaments ?? []).reduce<
    Record<string, { name: string; start_at: string }>
  >((acc, t) => {
    if (!acc[t.arcade_id]) acc[t.arcade_id] = { name: t.name, start_at: t.start_at };
    return acc;
  }, {});

  const enriched = (arcades ?? []).map((a) => ({
    ...a,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    nextTournament: nextByArcade[a.id] ?? null,
  }));

  const cities = Array.from(new Set(enriched.map((a) => a.city))).sort();
  const games = Array.from(
    new Set(enriched.flatMap((a) => a.games_supported as string[]))
  ).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-display text-5xl text-white mb-2">ARCADES</h1>
          <p className="text-zinc-400">Find venues running NexCade events across South Africa</p>
        </div>
        <ArcadeApplyButton />
      </div>

      <ArcadeDiscovery arcades={enriched as any} cities={cities} games={games} />
    </div>
  );
}
