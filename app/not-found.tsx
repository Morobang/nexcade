import Link from 'next/link';
import { Gamepad2, Home, Trophy, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        <div className="w-20 h-20 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Gamepad2 className="w-10 h-10 text-red-500" />
        </div>

        <p className="text-red-500 font-bold text-sm uppercase tracking-widest mb-3">404</p>
        <h1 className="font-display text-5xl text-white mb-4">PAGE NOT FOUND</h1>
        <p className="text-zinc-400 text-base leading-relaxed mb-10">
          Looks like this page got knocked out. Head back and find your next match.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
          <Link
            href="/tournaments"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold rounded-xl transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Tournaments
          </Link>
          <Link
            href="/arcades"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold rounded-xl transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Arcades
          </Link>
        </div>

      </div>
    </div>
  );
}
