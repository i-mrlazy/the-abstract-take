import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Review } from '../types';
import { X, Bookmark, Trash2, ArrowRight, Film } from 'lucide-react';
import { AbstractScoreBadge } from './AbstractScoreBadge';
import { normalizeScore } from '../utils/rating';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarkedReviews: Review[];
  onRemoveBookmark: (id: string) => void;
  onSelectReview?: (review: Review) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarkedReviews,
  onRemoveBookmark,
  onSelectReview,
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handleReviewClick = (rev: Review) => {
    if (onSelectReview) onSelectReview(rev);
    navigate(`/reviews/${rev.slug}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end text-left">
      <div className="bg-white border-l border-gray-200 w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-white text-gray-900 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center space-x-2 font-sans font-bold text-base text-[#111111]">
            <div className="p-2 bg-blue-50 text-[#008CFF] rounded-xl border border-blue-100">
              <Bookmark className="w-4 h-4" />
            </div>
            <span>Saved Takes ({bookmarkedReviews.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
          {bookmarkedReviews.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto text-[#008CFF]">
                <Bookmark className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-black text-lg text-[#111111]">Your Watchlist is Empty</h4>
              <p className="text-xs font-news text-gray-500 max-w-xs mx-auto">
                Save reviews, anime, and series to build your personalized watch queue.
              </p>
            </div>
          ) : (
            bookmarkedReviews.map((rev) => {
              const score = normalizeScore(rev.abstractScore);
              return (
                <div
                  key={rev.id}
                  onClick={() => handleReviewClick(rev)}
                  className="p-3.5 bg-white border border-gray-200/90 rounded-2xl flex gap-3.5 hover:border-[#008CFF] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <img
                    src={rev.posterUrl}
                    alt={rev.title}
                    className="w-16 h-24 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-[9px] font-mono font-bold uppercase bg-blue-50 text-[#008CFF] border border-blue-100 px-1.5 py-0.5 rounded">
                          {rev.type}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#008CFF]">
                          {score}/10
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#111111] group-hover:text-[#008CFF] transition-colors line-clamp-1 mt-1">
                        {rev.title}
                      </h4>
                      <p className="text-[10px] font-mono text-gray-400">
                        {rev.releaseYear} • Dir. {rev.director}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-[10px] font-mono font-bold text-[#008CFF] flex items-center gap-0.5">
                        View Take <ArrowRight className="w-3 h-3" />
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBookmark(rev.id);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                        title="Remove from saved"
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
};
