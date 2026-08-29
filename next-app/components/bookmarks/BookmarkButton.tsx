'use client';

import React from 'react';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/lib/context/BookmarksContext';

interface BookmarkButtonProps {
  reviewId: string;
  className?: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}

export function BookmarkButton({
  reviewId,
  className = '',
  variant = 'icon',
  size = 'md',
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(reviewId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(reviewId);
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center space-x-2 px-5 py-3 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs ${
          bookmarked
            ? 'bg-blue-50 border-blue-200 text-[#008CFF]'
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
        } ${className}`}
        aria-label={bookmarked ? 'Remove from saved watchlist' : 'Save to watchlist'}
      >
        <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-[#008CFF] text-[#008CFF]' : 'text-gray-500'}`} />
        <span>{bookmarked ? 'Saved to Watchlist' : 'Save Take'}</span>
      </button>
    );
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-xl transition-all cursor-pointer shadow-2xs ${
        bookmarked
          ? 'bg-blue-50 border border-blue-200 text-[#008CFF]'
          : 'bg-white/90 backdrop-blur-xs border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
      } ${className}`}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this review'}
      title={bookmarked ? 'Saved to Watchlist' : 'Save to Watchlist'}
    >
      <Bookmark className={`${iconSizes[size]} ${bookmarked ? 'fill-[#008CFF] text-[#008CFF]' : ''}`} />
    </button>
  );
}
