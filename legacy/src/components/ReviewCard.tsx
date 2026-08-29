import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Review } from '../types';
import { AbstractScoreBadge } from './AbstractScoreBadge';
import { Bookmark, Clock, Heart, Tv, ArrowUpRight } from 'lucide-react';
import { getQualityLabel, normalizeScore } from '../utils/rating';

interface ReviewCardProps {
  review: Review;
  onSelect?: (review: Review) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (reviewId: string, e: React.MouseEvent) => void;
  isLiked?: boolean;
  onToggleLike?: (reviewId: string, e: React.MouseEvent) => void;
  layout?: 'grid' | 'horizontal' | 'compact' | 'featured';
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onSelect,
  isBookmarked = false,
  onToggleBookmark,
  isLiked = false,
  onToggleLike,
  layout = 'grid',
}) => {
  const navigate = useNavigate();

  const getMediaTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Movie':
        return 'bg-[#111111] text-white';
      case 'Series':
      case 'Mini Series':
        return 'bg-[#008CFF] text-white';
      case 'Anime':
        return 'bg-[#D97706] text-white';
      case 'Documentary':
        return 'bg-[#15803D] text-white';
      default:
        return 'bg-gray-800 text-white';
    }
  };

  const qualityLabel = getQualityLabel(review.abstractScore);
  const normalizedScore = normalizeScore(review.abstractScore);

  const handleClick = () => {
    if (onSelect) {
      onSelect(review);
    }
    navigate(`/reviews/${review.slug || review.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (layout === 'horizontal') {
    return (
      <div
        onClick={handleClick}
        className="p-5 sm:p-6 rounded-2xl border border-gray-200/90 flex flex-col sm:flex-row gap-5 cursor-pointer group bg-white shadow-sm hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-200 text-left"
      >
        <div className="relative w-full sm:w-48 h-60 sm:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-gray-900 border border-gray-100 shadow-2xs">
          <img
            src={review.posterUrl}
            alt={review.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`text-[10px] font-sans font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-xs ${getMediaTypeBadgeColor(
                review.type
              )}`}
            >
              {review.type}
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <AbstractScoreBadge score={review.abstractScore} size="sm" />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                {review.releaseYear} · {review.runtime}
              </span>
            </div>

            <h3 className="font-serif font-black text-2xl text-[#111111] group-hover:text-[#008CFF] transition-colors leading-tight">
              {review.title}
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#008CFF]/10 text-[#008CFF] rounded-md border border-[#008CFF]/20">
                {normalizedScore}/10 · {qualityLabel.toUpperCase()}
              </span>
            </div>

            <p className="text-xs font-news text-gray-700 line-clamp-3 leading-relaxed pt-1 italic">
              "{review.myTake || review.verdictText}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
            <span className="font-sans font-black text-[11px] text-[#008CFF] group-hover:underline flex items-center gap-0.5">
              Read Take <ArrowUpRight className="w-3.5 h-3.5" />
            </span>

            <div className="flex items-center space-x-2">
              {onToggleBookmark && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(review.id, e);
                  }}
                  className={`p-2 rounded-lg border transition-colors ${
                    isBookmarked
                      ? 'bg-[#008CFF] text-white border-[#008CFF]'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                  title="Save Take"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
              )}

              {onToggleLike && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(review.id, e);
                  }}
                  className={`p-2 rounded-lg border transition-colors ${
                    isLiked
                      ? 'bg-[#008CFF] text-white border-[#008CFF]'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                  title="Like Take"
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="rounded-2xl border border-gray-200/90 overflow-hidden cursor-pointer group bg-white flex flex-col justify-between h-full shadow-sm hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-200 text-left"
    >
      <div>
        <div className="relative aspect-[16/10] w-full border-b border-gray-100 overflow-hidden bg-gray-900">
          <img
            src={review.bannerUrl || review.posterUrl}
            alt={review.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
          />
          <div className="absolute top-3 left-3">
            <span
              className={`text-[10px] font-sans font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-xs ${getMediaTypeBadgeColor(
                review.type
              )}`}
            >
              {review.type}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <AbstractScoreBadge score={review.abstractScore} size="sm" />
          </div>
        </div>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
            <span>{review.releaseYear}</span>
            <span>{review.runtime}</span>
          </div>

          <h3 className="font-serif font-black text-xl text-[#111111] group-hover:text-[#008CFF] transition-colors leading-snug line-clamp-1">
            {review.title}
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#008CFF]/10 text-[#008CFF] rounded-md border border-[#008CFF]/20">
              {normalizedScore}/10 · {qualityLabel.toUpperCase()}
            </span>
          </div>

          <p className="text-xs font-sans text-gray-500 font-semibold">
            Dir. {review.director}
          </p>

          <p className="text-xs font-news text-gray-700 line-clamp-2 leading-relaxed pt-1 italic">
            "{review.myTake || review.verdictText}"
          </p>
        </div>
      </div>

      {/* Footer Bar inside card */}
      <div className="p-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="font-sans font-black text-[11px] text-[#008CFF] group-hover:underline flex items-center gap-0.5">
          Read Take <ArrowUpRight className="w-3.5 h-3.5" />
        </span>

        <div className="flex items-center space-x-1.5">
          {onToggleBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(review.id, e);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                isBookmarked ? 'bg-[#008CFF] text-white border-[#008CFF]' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
              title="Save to Watchlist"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(review.id, e);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                isLiked ? 'bg-[#008CFF] text-white border-[#008CFF]' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
              title="Like Take"
            >
              <Heart className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
