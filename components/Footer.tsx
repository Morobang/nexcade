'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-lg">N</span>
              </div>
              <span className="text-lg font-black text-white">NexCade</span>
            </div>
            <p className="text-zinc-400 text-sm">
              South Africa's ultimate gaming arcade tournament platform.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-bold text-white mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/tournaments" className="hover:text-white transition-colors">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link href="/arcades" className="hover:text-white transition-colors">
                  Arcades
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-white transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/live" className="hover:text-white transition-colors">
                  Live
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white transition-colors">
                  News
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-bold text-white mb-4">Community</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  YouTube
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-zinc-500 text-sm">
            © 2026 NexCade. All rights reserved.
          </p>
          <p className="text-zinc-500 text-sm">
            Made with <Flame className="w-4 h-4 text-red-500 inline-block" /> by South Africa's fighting game community
          </p>
        </div>
      </div>
    </footer>
  );
}
