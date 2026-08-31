'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Settings,
  Search,
  Bookmark,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { MobileNavMenu } from './MobileNavMenu';
import { useBookmarks } from '@/lib/context/BookmarksContext';
import { useAiConcierge } from '@/lib/context/AiConciergeContext';

export interface ReviewCategoryItem {
  path: string;
  label: string;
  description: string;
}

export const REVIEW_CATEGORIES: ReviewCategoryItem[] = [
  { path: '/reviews', label: 'All Reviews', description: 'Complete critique archives across all formats' },
  { path: '/movies', label: 'Movies', description: 'Feature films, arthouse, & auteur cinema' },
  { path: '/series', label: 'Series', description: 'Long-form television & prestige series' },
  { path: '/anime', label: 'Anime', description: 'Feature anime & canonical animation' },
  { path: '/documentaries', label: 'Documentaries', description: 'Non-fiction & investigative essays' },
  { path: '/mini-series', label: 'Mini-Series', description: 'Limited series & self-contained stories' },
  { path: '/specials', label: 'Specials', description: 'Directorial cuts & cinematic events' },
];

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { bookmarkedCount, openDrawer } = useBookmarks();
  const { openConcierge } = useAiConcierge();

  const [reviewsDropdownOpen, setReviewsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setReviewsDropdownOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReviewsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setReviewsDropdownOpen(false);
  }, [pathname]);

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
    <header className="sticky top-0 z-40 w-full bg-[#111111] text-white border-b border-gray-800 shadow-md">
      {/* Top Utility Micro-Bar */}
      <div className="hidden md:block w-full bg-[#0A0A0A] border-b border-white/5 text-[11px] font-mono text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 whitespace-nowrap min-w-0">
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#008CFF] animate-pulse shrink-0" />
              <span className="text-gray-300 font-bold uppercase tracking-widest">
                CRITICAL FILM & TV ESSAYS
              </span>
            </div>
            <span className="text-gray-700 shrink-0">|</span>
            <span className="text-gray-400 font-sans italic text-xs truncate">
              Personal takes on what’s truly worth watching.
            </span>
          </div>

          <div className="flex items-center space-x-4 whitespace-nowrap shrink-0">
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3 min-w-0">
          {/* Left: Brand Identity (Links to Home /) */}
          <Link
            href="/"
            className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer group select-none shrink-0 min-w-0"
            title="The Abstract Take — Home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#008CFF] via-[#00C0FF] to-cyan-300 flex items-center justify-center text-black font-black text-sm sm:text-base shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
              AT
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-serif font-black text-base sm:text-lg tracking-tight text-white group-hover:text-[#00C0FF] transition-colors leading-none truncate">
                THE ABSTRACT TAKE
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-mono uppercase tracking-widest text-gray-400 font-medium leading-tight mt-0.5 truncate hidden sm:block">
                Uncompromising Cinema Critique
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-2 font-sans text-xs uppercase tracking-wider font-bold">
            {/* All Reviews with Accessible Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div
                className={`inline-flex items-center rounded-lg transition-all ${
                  isReviewActive
                    ? 'bg-[#008CFF] text-white shadow-xs'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Link
                  href="/reviews"
                  className="px-3 py-2 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>All Reviews</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setReviewsDropdownOpen((prev) => !prev)}
                  className={`px-1.5 py-2 rounded-r-lg transition-colors cursor-pointer ${
                    isReviewActive ? 'hover:bg-[#0077dd]' : 'hover:bg-white/10'
                  }`}
                  aria-expanded={reviewsDropdownOpen}
                  aria-haspopup="true"
                  aria-label="Toggle Reviews Category Menu"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      reviewsDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Dropdown Menu */}
              {reviewsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#161616] border border-gray-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase px-3 py-1.5 border-b border-gray-800 mb-1">
                    Review Archives by Format
                  </div>
                  <div className="space-y-0.5">
                    {REVIEW_CATEGORIES.map((cat) => {
                      const active = pathname === cat.path;
                      return (
                        <Link
                          key={cat.path}
                          href={cat.path}
                          onClick={() => setReviewsDropdownOpen(false)}
                          className={`block px-3 py-2 rounded-xl transition-all ${
                            active
                              ? 'bg-[#008CFF] text-white font-bold'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-mono font-bold">{cat.label}</div>
                          <div className="text-[10px] text-gray-400 font-sans normal-case truncate">
                            {cat.description}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* What Should I Watch Next? (Unified Discovery CTA) */}
            <button
              onClick={openConcierge}
              className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#00C0FF] hover:text-white transition-all flex items-center space-x-1.5 cursor-pointer font-bold"
              title="Personalized recommendation discovery engine"
            >
              <Compass className="w-3.5 h-3.5 text-[#00C0FF]" />
              <span>What Should I Watch Next?</span>
            </button>

            {/* About */}
            <Link
              href="/about"
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                pathname === '/about'
                  ? 'bg-[#008CFF] text-white shadow-xs font-bold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>About</span>
            </Link>

            {/* Contact */}
            <Link
              href="/contact"
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                pathname === '/contact'
                  ? 'bg-[#008CFF] text-white shadow-xs font-bold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Contact</span>
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Search Trigger */}
            <Link
              href="/search"
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center space-x-2 bg-white/5 border border-white/10 shrink-0"
              title="Search takes (Cmd+K)"
            >
              <Search className="w-4 h-4 text-[#00C0FF]" />
              <span className="hidden sm:inline text-xs font-mono text-gray-400">Search</span>
              <kbd className="hidden md:inline text-[9px] font-mono bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </Link>

            {/* Bookmarks Drawer Trigger */}
            <button
              onClick={openDrawer}
              className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/10 shrink-0"
              title="Saved takes"
              aria-label={`Saved takes (${bookmarkedCount})`}
            >
              <Bookmark
                className={`w-4 h-4 ${bookmarkedCount > 0 ? 'fill-[#008CFF] text-[#008CFF]' : ''}`}
              />
              {bookmarkedCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#008CFF] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center border border-[#111111] shadow-2xs">
                  {bookmarkedCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <MobileNavMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
