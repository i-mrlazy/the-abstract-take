import React from 'react';
import { RATING_SCALE, normalizeScore } from '../../lib/utils/rating';

interface AbstractScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showLabel?: boolean;
  showDescriptor?: boolean;
  className?: string;
}

export function AbstractScoreBadge({
  score,
  size = 'md',
  showLabel = false,
  showDescriptor = false,
  className = '',
}: AbstractScoreBadgeProps) {
  const normScore = normalizeScore(score);
  const ratingData = RATING_SCALE.find((s) => s.score === normScore) || RATING_SCALE[3];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 min-w-[2.2rem]',
    md: 'text-sm px-2.5 py-1 min-w-[2.6rem]',
    lg: 'text-xl px-4 py-2 min-w-[3.4rem]',
    hero: 'text-4xl px-6 py-3 min-w-[5.5rem]',
  };

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {showLabel && (
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#008CFF] uppercase mb-1">
          Abstract Score
        </span>
      )}

      <div
        className={`inline-flex items-center justify-center font-serif font-black rounded-xl border tracking-tight shadow-xs ${ratingData.color.bg} ${ratingData.color.text} ${ratingData.color.border} ${sizeClasses[size]}`}
      >
        <span>{normScore}</span>
        <span className="text-[0.6em] font-sans font-medium opacity-70 ml-0.5">/10</span>
      </div>

      {showDescriptor && (
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-700 mt-1.5">
          {ratingData.descriptor}
        </span>
      )}
    </div>
  );
}
