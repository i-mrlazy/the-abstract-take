'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Film,
  Clapperboard,
  Tv,
  Sparkles,
  Compass,
  Info,
  Mail,
  Settings,
  Search,
  Bookmark,
} from 'lucide-react';
import { MobileNavMenu } from './MobileNavMenu';
import { useBookmarks } from '@/lib/context/BookmarksContext';
import { useAiConcierge } from '@/lib/context/AiConciergeContext';

export interface NavLinkItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_LINKS: NavLinkItem[] = [
  { path: '/', label: 'My Take', icon: Film },
  { path: '/reviews', label: 'All Reviews', icon: Clapperboard },
  { path: '/movies', label: 'Movies', icon: Film },
  { path: '/series', label: 'Series', icon: Tv },
  { path: '/anime', label: 'Anime', icon: Sparkles },
  { path: '/recommends', label: 'Recommends', icon: Compass },
  { path: '/what-to-watch-next', label: 'What Next', icon: Sparkles },
  { path: '/about', label: 'About', icon: Info },
  { path: '/contact', label: 'Contact', icon: Mail },
];

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { bookmarkedCount, openDrawer } = useBookmarks();
  const { openConcierge } = useAiConcierge();

  // Cmd+K / Ctrl+K keyboard shortcut to jump to /search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#111111] text-white border-b border-gray-800 shadow-md">
      {/* Top Utility Micro-Bar */}
      <div className="hidden md:block w-full bg-[#0A0A0A] border-b border-white/5 text-[11px] font-mono text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 whitespace-nowrap">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#008CFF] animate-pulse" />
              <span className="text-gray-300 font-bold uppercase tracking-widest">
                CRITICAL FILM & TV ESSAYS
              </span>
            </div>
            <span className="text-gray-700">|</span>
            <span className="text-gray-400 font-sans italic text-xs">
              Personal takes on what’s truly worth watching.
            </span>
          </div>

          <div className="flex items-center space-x-4 whitespace-nowrap">
            <Link
              href="/admin"
              className="flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <Settings className="w-3 h-3 text-[#008CFF]" />
              <span>Editorial Studio</span>
              <span className="text-[9px] bg-white/10 px-1 py-0.2 rounded text-gray-300">
                Admin
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-3">
          {/* Left: Brand Identity */}
          <Link
            href="/"
            className="flex items-center space-x-2.5 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#008CFF] via-[#00C0FF] to-cyan-300 flex items-center justify-center text-black font-black text-base shadow-sm group-hover:scale-105 transition-transform duration-200">
              AT
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-black text-lg tracking-tight text-white group-hover:text-[#00C0FF] transition-colors leading-none">
                THE ABSTRACT TAKE
              </span>
              <span className="text-[9.5px] font-mono uppercase tracking-widest text-gray-400 font-medium leading-tight mt-0.5">
                My Take on What&apos;s Worth Watching
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 font-sans text-xs uppercase tracking-wider font-bold">
            {NAV_LINKS.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                    active
                      ? 'bg-[#008CFF] text-white shadow-xs font-bold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Trigger */}
            <Link
              href="/search"
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center space-x-2 bg-white/5 border border-white/10"
              title="Search takes (Cmd+K)"
            >
              <Search className="w-4 h-4 text-[#00C0FF]" />
              <span className="hidden sm:inline text-xs font-mono text-gray-400">Search</span>
              <kbd className="hidden md:inline text-[9px] font-mono bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </Link>

            {/* AI Concierge Trigger */}
            <button
              onClick={openConcierge}
              className="bg-gradient-to-r from-[#008CFF] to-cyan-500 hover:from-[#0077dd] hover:to-cyan-600 text-white p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-mono font-bold uppercase flex items-center space-x-1.5 shadow-sm hover:shadow-cyan-500/20 hover:-translate-y-0.5 transition-all cursor-pointer"
              title="Personal AI Recommendation Concierge"
              aria-label="Open AI Recommendation Concierge"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Curator AI</span>
            </button>

            {/* Bookmarks Drawer Trigger */}
            <button
              onClick={openDrawer}
              className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Saved takes"
              aria-label={`Saved takes (${bookmarkedCount})`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarkedCount > 0 ? 'fill-[#008CFF] text-[#008CFF]' : ''}`} />
              {bookmarkedCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#008CFF] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center border border-[#111111] shadow-2xs">
                  {bookmarkedCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <MobileNavMenu navLinks={NAV_LINKS} />
          </div>
        </div>
      </div>
    </header>
  );
}
