import React from 'react';
import { Star, Award } from 'lucide-react';
import { normalizeRating, getRatingWord, getRatingText } from '../utils/rating';

interface EbertStarRatingProps {
  score: number; // 1 to 10
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGreatMovieBadge?: boolean;
  className?: string;
}

export const EbertStarRating: React.FC<EbertStarRatingProps> = ({
  score,
  size = 'md',
  showGreatMovieBadge = false,
  className = '',
}) => {
  const normScore = normalizeRating(score);
  const ratingWord = getRatingWord(normScore);
  const ratingFullText = getRatingText(normScore);
  const isMasterpieceOrBrilliant = normScore >= 9;

  // Star size mapping
  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm font-bold',
    xl: 'text-base font-bold',
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 10; i++) {
      stars.push(
        <Star
          key={i}
          className={`${starSizes[size]} ${
            i <= normScore
              ? 'fill-[#D97706] text-[#D97706] stroke-[1.5]'
              : 'text-[#E2E8F0] stroke-[1]'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      {/* 10 Stars row */}
      <div className="flex items-center space-x-0.5" title={`${normScore}/10 (${ratingWord})`}>
        {renderStars()}
      </div>

      {/* Integer rating and word descriptor */}
      <span className={`font-mono font-bold text-[#B45309] ${textSizes[size]}`}>
        {ratingFullText}
      </span>

      {showGreatMovieBadge && isMasterpieceOrBrilliant && (
        <span className="inline-flex items-center space-x-1 bg-[#008CFF] text-white text-[10px] font-sans uppercase font-extrabold px-2 py-0.5 rounded tracking-wide shadow-xs">
          <Award className="w-3 h-3 text-[#FDE047]" />
          <span>{normScore === 10 ? 'Masterpiece' : 'Brilliant'}</span>
        </span>
      )}
    </div>
  );
};
