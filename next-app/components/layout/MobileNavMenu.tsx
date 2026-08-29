'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function MobileNavMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 hover:text-[#008CFF] rounded-xl focus:outline-none cursor-pointer"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 z-50 border-b border-gray-200/90 bg-[#FAF9F6] px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <Link
            href="/movies"
            onClick={() => setIsOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-800 hover:bg-white transition-colors"
          >
            Movies
          </Link>
          <Link
            href="/series"
            onClick={() => setIsOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-800 hover:bg-white transition-colors"
          >
            Series
          </Link>
          <Link
            href="/anime"
            onClick={() => setIsOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-800 hover:bg-white transition-colors"
          >
            Anime
          </Link>
          <Link
            href="/recommends"
            onClick={() => setIsOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-800 hover:bg-white transition-colors"
          >
            The Abstract Recommends
          </Link>
          <Link
            href="/what-to-watch-next"
            onClick={() => setIsOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-800 hover:bg-white transition-colors"
          >
            What To Watch
          </Link>
          <Link
            href="/about"
            onClick={() => setIsOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-800 hover:bg-white transition-colors"
          >
            About & Scoring
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-800 hover:bg-white transition-colors"
          >
            Contact
          </Link>
        </div>
      )}
    </div>
  );
}
