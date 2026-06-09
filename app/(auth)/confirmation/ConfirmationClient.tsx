'use client';

import { useRef } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  CheckCircle2, Download, MessageCircle, LayoutDashboard,
  Gamepad2, Calendar, MapPin, Trophy, Hash,
} from 'lucide-react';

const GAME_COLORS: Record<string, string> = {
  FC26: '#f97316', Tekken8: '#3b82f6', SF6: '#eab308',
  MK1: '#ec4899', KOFXV: '#fde047', Naruto: '#22c55e',
};

const FORMAT_LABELS: Record<string, string> = {
  knockout: 'Single Elimination',
  group_ko: 'Group Stage + Knockout',
  league: 'League (Round Robin)',
};

type Reg = {
  id: string;
  booking_ref: string;
  registration_status: string;
  payment_status: string;
  registered_at: string;
  character_1: string | null;
  character_2: string | null;
  character_3: string | null;
  support_character: string | null;
  team_name: string | null;
  team_type: string | null;
  tournaments: {
    id: string; name: string; slug: string; game_type: string;
    format: string; status: string; start_at: string;
    entry_fee: number; prize_pool: number; venue: string | null;
    arcades: { name: string; city: string; whatsapp_number: string | null; contact_email: string | null } | null;
  } | null;
  profiles: { gamer_tag: string; full_name: string; phone: string | null } | null;
};

export function ConfirmationClient({ reg }: { reg: Reg }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const t = reg.tournaments;
  const arcade = t?.arcades ?? null;
  const profile = reg.profiles;
  const accentColor = t ? (GAME_COLORS[t.game_type] ?? '#71717a') : '#71717a';

  // Build character summary string
  const charParts: string[] = [];
  if (reg.team_name) charParts.push(reg.team_name + (reg.team_type ? ` (${reg.team_type})` : ''));
  if (reg.character_1) charParts.push(reg.character_1);
  if (reg.character_2) charParts.push(reg.character_2);
  if (reg.character_3) charParts.push(reg.character_3);
  if (reg.support_character) charParts.push(`Support: ${reg.support_character}`);

  // WhatsApp message
  function buildWhatsAppUrl() {
    if (!arcade?.whatsapp_number) return null;
    const number = arcade.whatsapp_number.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hi ${arcade.name},\n\nI have registered for *${t?.name ?? 'the tournament'}* on ${t ? formatDate(t.start_at, 'time') : ''}.\n\nGamer tag: ${profile?.gamer_tag ?? ''}\nBooking ref: ${reg.booking_ref}\n\nPlease confirm my spot. Thank you!`
    );
    return `https://wa.me/${number}?text=${message}`;
  }

  // Download QR as PNG using canvas
  function downloadQR() {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `nexcade-${reg.booking_ref}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }

  const whatsAppUrl = buildWhatsAppUrl();

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">

      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="font-display text-4xl text-white mb-2">YOU&apos;RE IN!</h1>
        <p className="text-zinc-400 text-sm">Registration confirmed. See you at the tournament.</p>
      </div>

      {/* Booking ref + QR */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-5">
        <div className="h-1 w-full" style={{ background: accentColor }} />

        <div className="p-6 flex flex-col items-center gap-5">
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Booking reference</p>
            <p className="font-mono text-xl font-bold text-white tracking-wider">{reg.booking_ref}</p>
          </div>

          {/* QR code */}
          <div ref={qrRef} className="bg-white p-4 rounded-xl">
            <QRCode
              value={reg.booking_ref}
              size={180}
              bgColor="#ffffff"
              fgColor="#09090b"
            />
          </div>

          <p className="text-xs text-zinc-500 text-center">
            Show this QR code at the arcade for check-in.
          </p>

          <button
            onClick={downloadQR}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-semibold text-zinc-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download QR
          </button>
        </div>
      </div>

      {/* Tournament summary */}
      {t && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>
            {t.game_type}
          </p>
          <h2 className="font-display text-2xl text-white mb-4">{t.name}</h2>

          <div className="flex flex-col gap-3">
            {[
              { icon: Calendar, label: 'Date & time', value: formatDate(t.start_at, 'time') },
              { icon: Gamepad2, label: 'Format', value: FORMAT_LABELS[t.format] ?? t.format },
              ...(arcade ? [{ icon: MapPin, label: 'Arcade', value: `${arcade.name}, ${arcade.city}` }] : []),
              ...(t.venue ? [{ icon: MapPin, label: 'Venue', value: t.venue }] : []),
              { icon: Trophy, label: 'Prize pool', value: formatCurrency(t.prize_pool) },
              { icon: Hash, label: 'Entry fee', value: formatCurrency(t.entry_fee) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Icon className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-zinc-500 text-xs">{label}</p>
                  <p className="text-zinc-200">{value}</p>
                </div>
              </div>
            ))}

            {charParts.length > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <Gamepad2 className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-zinc-500 text-xs">Your selection</p>
                  <p className="text-zinc-200">{charParts.join(' · ')}</p>
                </div>
              </div>
            )}

            {reg.payment_status === 'pending' && (
              <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-xs text-yellow-400">
                Payment pending — bring your entry fee on the day or pay via EFT before the tournament.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {whatsAppUrl && (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp {arcade?.name}
          </a>
        )}

        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors text-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
        </Link>

        <Link
          href="/tournaments"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold transition-colors text-sm"
        >
          <Gamepad2 className="w-4 h-4" />
          View More Tournaments
        </Link>
      </div>
    </div>
  );
}
