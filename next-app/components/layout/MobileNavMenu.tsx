'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Settings,
  Bookmark,
  Compass,
  ChevronDown,
  Info,
  Mail,
  Search,
  Clapperboard,
  Film,
  Tv,
  Sparkles,
  Layers,
} from 'lucide-react';
import { REVIEW_CATEGORIES } from './TopNavbar';
import { useBookmarks } from '@/lib/context/BookmarksContext';
import { useAiConcierge } from '@/lib/context/AiConciergeContext';

export function MobileNavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(true);
  const pathname = usePathname();
  const { bookmarkedCount, openDrawer } = useBookmarks();
  const { openConcierge } = useAiConcierge();

  // Close mobile drawer on route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close mobile drawer on screen resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isReviewActive =
    pathname === '/reviews' ||
    pathname.startsWith('/reviews/') ||
    pathname === '/movies' ||
    pathname === '/series' ||
    pathname === '/anime' ||
    pathname === '/documentaries' ||
    pathname === '/mini-series' ||
    pathname === '/specials';

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 z-50 bg-[#161616] border-b border-gray-800 px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          {/* What Should I Watch Next? Primary Discovery Action */}
          <button
            onClick={() => {
              setIsOpen(false);
              openConcierge();
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-mono font-bold uppercase transition-all bg-gradient-to-r from-[#008CFF]/20 to-cyan-500/20 border border-[#008CFF]/40 text-white hover:bg-[#008CFF]/30 cursor-pointer shadow-xs"
          >
            <div className="flex items-center space-x-2.5">
              <Compass className="w-4 h-4 text-[#00C0FF]" />
              <span>What Should I Watch Next?</span>
            </div>
            <span className="bg-[#008CFF] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Curator
            </span>
          </button>

          {/* Saved Takes Quick Action */}
          <button
            onClick={() => {
              setIsOpen(false);
              openDrawer();
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white cursor-pointer border border-white/10"
          >
            <div className="flex items-center space-x-2.5">
              <Bookmark className="w-4 h-4 text-[#00C0FF] fill-[#00C0FF]" />
              <span>Saved Takes (Watchlist)</span>
            </div>
            {bookmarkedCount > 0 && (
              <span className="bg-[#008CFF] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {bookmarkedCount}
              </span>
            )}
          </button>

          {/* Expandable Review Archives Category */}
          <div className="bg-black/40 border border-gray-800/80 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setReviewsExpanded((prev) => !prev)}
              className={`w-full flex items-center justify-between px-4 py-3 text-xs font-mono font-bold uppercase cursor-pointer transition-colors ${
                isReviewActive ? 'text-[#00C0FF]' : 'text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Clapperboard className="w-4 h-4 text-[#008CFF]" />
                <span>All Reviews & Archives</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  reviewsExpanded ? 'rotate-180 text-[#00C0FF]' : 'text-gray-500'
                }`}
              />
            </button>

            {reviewsExpanded && (
              <div className="px-3 pb-3 pt-1 space-y-1 border-t border-gray-800/50">
                {REVIEW_CATEGORIES.map((cat) => {
                  const active = pathname === cat.path;
                  return (
                    <Link
                      key={cat.path}
                      href={cat.path}
                      onClick={() => setIsOpen(false)}
                      className={`block px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                        active
                          ? 'bg-[#008CFF] text-white font-bold'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{cat.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                pathname === '/search'
                  ? 'bg-[#008CFF] text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 text-[#00C0FF]" />
              <span>Search Archives</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                pathname === '/about'
                  ? 'bg-[#008CFF] text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Info className="w-4 h-4 text-[#00C0FF]" />
              <span>About Editorial Ethos</span>
            </Link>

            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                pathname === '/contact'
                  ? 'bg-[#008CFF] text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 text-[#00C0FF]" />
              <span>Contact & Enquiries</span>
            </Link>
          </div>

          {/* Admin Studio Trigger */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 text-xs font-mono text-gray-400 hover:text-white py-1 transition-colors"
            >
              <Settings className="w-4 h-4 text-[#008CFF]" />
              <span>Editorial Studio (Admin)</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
