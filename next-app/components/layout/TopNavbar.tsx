import React from 'react';
import Link from 'next/link';
import { MobileNavMenu } from './MobileNavMenu';
import { Search } from 'lucide-react';

export function TopNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[#008CFF] text-white rounded-xl flex items-center justify-center font-serif font-black text-lg shadow-xs group-hover:scale-105 transition-transform">
                AT
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-black text-lg md:text-xl tracking-tight text-gray-950 group-hover:text-[#008CFF] transition-colors leading-none">
                  THE ABSTRACT TAKE
                </span>
                <span className="text-[10px] font-mono tracking-widest text-[#008CFF] uppercase font-bold mt-1">
                  Cinema & TV Editorial
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links (Server Rendered) */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/movies"
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-700 hover:text-[#008CFF] hover:bg-white/80 transition-all"
            >
              Movies
            </Link>
            <Link
              href="/series"
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-700 hover:text-[#008CFF] hover:bg-white/80 transition-all"
            >
              Series
            </Link>
            <Link
              href="/anime"
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-700 hover:text-[#008CFF] hover:bg-white/80 transition-all"
            >
              Anime
            </Link>
            <Link
              href="/recommends"
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-700 hover:text-[#008CFF] hover:bg-white/80 transition-all"
            >
              The Abstract Recommends
            </Link>
            <Link
              href="/what-to-watch-next"
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-700 hover:text-[#008CFF] hover:bg-white/80 transition-all"
            >
              What To Watch
            </Link>
            <Link
              href="/about"
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-gray-700 hover:text-[#008CFF] hover:bg-white/80 transition-all"
            >
              About
            </Link>
            <Link
              href="/search"
              className="p-2 ml-1 text-gray-600 hover:text-[#008CFF] hover:bg-white rounded-xl transition-all"
              aria-label="Search reviews"
            >
              <Search className="w-4 h-4" />
            </Link>
          </nav>

          {/* Isolated Client Island for Mobile Menu */}
          <MobileNavMenu />
        </div>
      </div>
    </header>
  );
}
