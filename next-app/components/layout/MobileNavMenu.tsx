'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Settings, Bookmark } from 'lucide-react';
import type { NavLinkItem } from './TopNavbar';
import { useBookmarks } from '@/lib/context/BookmarksContext';

interface MobileNavMenuProps {
  navLinks: NavLinkItem[];
}

export function MobileNavMenu({ navLinks }: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { bookmarkedCount, openDrawer } = useBookmarks();

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

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

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
        <div className="absolute top-16 left-0 right-0 z-50 bg-[#161616] border-b border-gray-800 px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* Saved Takes Quick Action */}
          <button
            onClick={() => {
              setIsOpen(false);
              openDrawer();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white cursor-pointer border border-white/10"
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

          <div className="space-y-1">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                    active
                      ? 'bg-[#008CFF] text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#00C0FF]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

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
