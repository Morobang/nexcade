import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'NexCade — SA Gaming Tournaments';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: 64,
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontSize: 52, fontWeight: 900, lineHeight: 1 }}>N</span>
          </div>
          <span style={{ color: 'white', fontSize: 80, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>
            NEXCADE
          </span>
        </div>

        {/* Tagline */}
        <p style={{ color: '#a1a1aa', fontSize: 30, margin: 0, textAlign: 'center' }}>
          South Africa&apos;s Gaming Tournament Platform
        </p>

        {/* Game tags */}
        <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
          {['FC26', 'Tekken 8', 'SF6', 'MK1', 'KOF XV'].map((g) => (
            <div
              key={g}
              style={{
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: 8,
                padding: '8px 16px',
                color: '#d4d4d8',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {g}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
