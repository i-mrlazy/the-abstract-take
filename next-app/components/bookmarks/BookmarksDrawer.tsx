'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useBookmarks } from '@/lib/context/BookmarksContext';
import { ReviewArtwork } from '@/components/ui/ReviewArtwork';
import { X, Bookmark, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { normalizeScore } from '@/lib/utils/rating';

export function BookmarksDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    bookmarkedReviews,
    bookmarkedCount,
    removeBookmark,
    clearBookmarks,
    isLoading,
  } = useBookmarks();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end text-left animate-in fade-in duration-200"
      onClick={closeDrawer}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white border-l border-gray-200 w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-white text-gray-900 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center space-x-2.5 font-sans font-bold text-base text-[#111111]">
            <div className="p-2 bg-blue-50 text-[#008CFF] rounded-xl border border-blue-100 shadow-2xs shrink-0">
              <Bookmark className="w-4 h-4 fill-[#008CFF]" />
            </div>
            <span>Saved Takes ({bookmarkedCount})</span>
          </div>

          <div className="flex items-center space-x-2">
            {bookmarkedCount > 0 && (
              <button
                onClick={clearBookmarks}
                className="text-[11px] font-mono text-gray-400 hover:text-red-600 px-2 py-1 rounded transition-colors cursor-pointer"
                title="Clear all saved takes"
              >
                Clear All
              </button>
            )}
            <button
              onClick={closeDrawer}
              className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
              aria-label="Close saved takes drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
          {isLoading && bookmarkedReviews.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Loader2 className="w-6 h-6 text-[#008CFF] animate-spin mx-auto" />
              <p className="text-xs font-mono text-gray-400">Loading your saved queue...</p>
            </div>
          ) : bookmarkedCount === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto text-[#008CFF]">
                <Bookmark className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-black text-lg text-[#111111]">Your Watchlist is Empty</h4>
              <p className="text-xs font-news text-gray-500 max-w-xs mx-auto leading-relaxed">
                Save reviews, anime, and series to build your personalized watch queue.
              </p>
            </div>
          ) : (
            bookmarkedReviews.map((rev) => {
              const score = normalizeScore(rev.abstractScore);
              return (
                <div
                  key={rev.id}
                  className="p-3.5 bg-white border border-gray-200/90 rounded-2xl flex gap-3.5 hover:border-[#008CFF] hover:shadow-xs transition-all group min-w-0"
                >
                  <Link
                    href={`/reviews/${rev.slug}`}
                    onClick={closeDrawer}
                    className="w-16 h-24 rounded-xl border border-gray-200 shrink-0 overflow-hidden block bg-gray-900 relative"
                  >
                    <ReviewArtwork
                      title={rev.title}
                      releaseYear={rev.releaseYear}
                      type={rev.type}
                      slug={rev.slug}
                      posterUrl={rev.posterUrl}
                      bannerUrl={rev.bannerUrl}
                      artwork={rev.artwork}
                      abstractScore={rev.abstractScore}
                      preferredType="poster"
                      aspectRatio="portrait"
                      sizes="64px"
                      alt={rev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[9px] font-mono font-bold uppercase bg-blue-50 text-[#008CFF] border border-blue-100 px-1.5 py-0.5 rounded shrink-0">
                          {rev.type}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#008CFF] shrink-0">
                          {score}/10
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#111111] group-hover:text-[#008CFF] transition-colors line-clamp-2 mt-1 break-words">
                        <Link href={`/reviews/${rev.slug}`} onClick={closeDrawer}>
                          {rev.title}
                        </Link>
                      </h4>
                      <p className="text-[10px] font-mono text-gray-400 truncate">
                        {rev.releaseYear} • Dir. {rev.director}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <Link
                        href={`/reviews/${rev.slug}`}
                        onClick={closeDrawer}
                        className="text-[10px] font-mono font-bold text-[#008CFF] flex items-center gap-0.5 hover:underline shrink-0"
                      >
                        <span>View Take</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => removeBookmark(rev.id)}
                        className="text-gray-400 hover:text-red-500 p-1 cursor-pointer transition-colors shrink-0"
                        title="Remove from saved"
                        aria-label={`Remove ${rev.title} from saved takes`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
