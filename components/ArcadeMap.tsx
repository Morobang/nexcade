'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { formatDate } from '@/lib/utils';

export interface ArcadeMapItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  latitude: number;
  longitude: number;
  games_supported: string[];
  nextTournament?: { name: string; start_at: string } | null;
}

function createPin(highlighted: boolean) {
  const color = highlighted ? '#ff4500' : '#dc2626';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:22px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.6);
    "></div>`,
    iconSize: [16, 22],
    iconAnchor: [8, 22],
    popupAnchor: [0, -24],
  });
}

function PanTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 12, { animate: true }); }, [lat, lng, map]);
  return null;
}

interface Props {
  arcades: ArcadeMapItem[];
  nearestId: string | null;
}

export default function ArcadeMap({ arcades, nearestId }: Props) {
  const nearest = arcades.find((a) => a.id === nearestId);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <MapContainer
      center={[-28.5, 25.5]}
      zoom={5}
      className="w-full h-full"
      scrollWheelZoom={false}
    >
      <TileLayer
        key={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileUrl}
      />

      {nearest && <PanTo lat={nearest.latitude} lng={nearest.longitude} />}

      {arcades.map((arcade) => (
        <Marker
          key={arcade.id}
          position={[arcade.latitude, arcade.longitude]}
          icon={createPin(arcade.id === nearestId)}
        >
          <Popup className="nexcade-popup">
            <div className="bg-surface rounded-lg p-3 min-w-[180px] text-sm">
              <p className="font-bold text-fg text-base mb-0.5">{arcade.name}</p>
              <p className="text-fg-3 text-xs mb-2">{arcade.city}</p>
              {arcade.games_supported.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {arcade.games_supported.map((g) => (
                    <span key={g} className="px-1.5 py-0.5 bg-elevated rounded text-fg-2 text-xs">{g}</span>
                  ))}
                </div>
              )}
              {arcade.nextTournament && (
                <p className="text-fg-3 text-xs mb-2">
                  Next: {formatDate(arcade.nextTournament.start_at, 'short')}
                </p>
              )}
              <Link
                href={`/arcades/${arcade.slug}`}
                className="inline-block w-full text-center py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
              >
                View Arcade →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
