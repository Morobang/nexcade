'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Gamepad2, Navigation } from 'lucide-react';
import type { ArcadeMapItem } from './ArcadeMap';

const ArcadeMap = dynamic(() => import('./ArcadeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-900 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-zinc-600 text-sm">Loading map…</p>
    </div>
  ),
});

interface Arcade extends ArcadeMapItem {
  description?: string;
}

interface Props {
  arcades: Arcade[];
  cities: string[];
  games: string[];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function ArcadeDiscovery({ arcades, cities, games }: Props) {
  const [city, setCity] = useState('');
  const [game, setGame] = useState('');
  const [search, setSearch] = useState('');
  const [nearestId, setNearestId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const filtered = useMemo(() => {
    return arcades.filter((a) => {
      if (city && a.city !== city) return false;
      if (game && !a.games_supported.includes(game)) return false;
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [arcades, city, game, search]);

  const mapArcades = useMemo(
    () => filtered.filter((a) => a.latitude && a.longitude) as ArcadeMapItem[],
    [filtered]
  );

  function findNearest() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearestArcade: Arcade | null = null;
        let minDist = Infinity;
        arcades.forEach((a) => {
          if (!a.latitude || !a.longitude) return;
          const dist = haversineKm(latitude, longitude, a.latitude, a.longitude);
          if (dist < minDist) { minDist = dist; nearestArcade = a; }
        });
        if (nearestArcade) setNearestId((nearestArcade as Arcade).id);
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  const selectClass =
    'bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-600 transition-colors';

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search arcades…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
          />
        </div>

        <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={game} onChange={(e) => setGame(e.target.value)} className={selectClass}>
          <option value="">All Games</option>
          {games.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        <button
          onClick={findNearest}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 hover:border-red-600 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" />
          {locating ? 'Locating…' : 'Nearest to me'}
        </button>

        {(city || game || search || nearestId) && (
          <button
            onClick={() => { setCity(''); setGame(''); setSearch(''); setNearestId(null); }}
            className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Map */}
      <div className="h-64 sm:h-96 lg:h-[480px] rounded-xl overflow-hidden border border-zinc-800">
        <ArcadeMap arcades={mapArcades} nearestId={nearestId} />
      </div>

      {/* Count */}
      <p className="text-zinc-500 text-sm">
        {filtered.length} arcade{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Gamepad2 className="w-14 h-14 text-zinc-700" />
          <p className="text-zinc-400 font-semibold">No arcades match your filters</p>
          <p className="text-zinc-600 text-sm">Try clearing the filters above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((arcade) => (
            <Link
              key={arcade.id}
              href={`/arcades/${arcade.slug}`}
              className={`group bg-zinc-900 border rounded-xl p-5 flex flex-col gap-4 hover:shadow-xl hover:shadow-red-600/10 transition-all ${
                arcade.id === nearestId
                  ? 'border-red-600/60 shadow-lg shadow-red-600/10'
                  : 'border-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-lg">{arcade.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base group-hover:text-red-400 transition-colors truncate">
                    {arcade.name}
                  </h3>
                  <p className="text-zinc-500 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {arcade.city}
                  </p>
                </div>
                {arcade.id === nearestId && (
                  <span className="text-xs text-red-400 font-bold shrink-0">Nearest</span>
                )}
              </div>

              {arcade.description && (
                <p className="text-zinc-400 text-sm line-clamp-2">{arcade.description}</p>
              )}

              {arcade.games_supported.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {arcade.games_supported.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-medium">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {arcade.nextTournament && (
                <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                  Next event: <span className="text-zinc-300">{arcade.nextTournament.name}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
