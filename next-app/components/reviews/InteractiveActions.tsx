'use client';

import React, { useState } from 'react';
import { Bookmark, Heart, Share2, Check } from 'lucide-react';
import { useBookmarks } from '@/lib/context/BookmarksContext';

interface InteractiveActionsProps {
  reviewId: string;
  initialLikes?: number;
}

export function InteractiveActions({ reviewId, initialLikes = 0 }: InteractiveActionsProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(reviewId);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [copied, setCopied] = useState(false);

  const handleToggleLike = () => {
    if (!isLiked) {
      setLikesCount((prev) => prev + 1);
      setIsLiked(true);
    } else {
      setLikesCount((prev) => Math.max(0, prev - 1));
      setIsLiked(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleToggleLike}
        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
          isLiked
            ? 'bg-rose-50 border-rose-200 text-rose-600 font-bold'
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
        aria-label="Like this take"
      >
        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
        <span>{likesCount}</span>
      </button>

      <button
        onClick={() => toggleBookmark(reviewId)}
        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
          bookmarked
            ? 'bg-blue-50 border-blue-200 text-[#008CFF]'
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this take'}
        title={bookmarked ? 'Saved to Watchlist' : 'Save to Watchlist'}
      >
        <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-[#008CFF]' : ''}`} />
      </button>

      <button
        onClick={handleShare}
        className="p-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-gray-300 transition-colors cursor-pointer relative"
        aria-label="Share this take"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
