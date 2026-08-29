import React from 'react';
import { normalizeScore, getQualityLabel, getRatingColorClasses, getScoreMeaning } from '../utils/rating';

interface AbstractScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  variant?: 'solid' | 'editorial' | 'minimal' | 'inline';
}

export const AbstractScoreBadge: React.FC<AbstractScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
  variant = 'solid',
}) => {
  const normScore = normalizeScore(score);
  const descriptor = getQualityLabel(normScore);
  const meaning = getScoreMeaning(normScore);
  const colors = getRatingColorClasses(normScore);

  if (variant === 'editorial') {
    return (
      <div
        className={`inline-flex items-center gap-3 p-3 bg-white text-[#111111] rounded-xl border border-gray-200/80 shadow-sm ${className}`}
        title={`${normScore}/10 - ${descriptor}: ${meaning}`}
      >
        <div className={`flex flex-col items-center justify-center ${colors.bg} ${colors.text} px-3 py-1.5 rounded-lg font-mono font-black text-xl leading-none shadow-xs`}>
          <span>{normScore}</span>
          <span className="text-[8px] font-sans uppercase tracking-widest text-white/90 mt-0.5">/10</span>
        </div>
        <div className="flex flex-col pr-2 text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">The Abstract Score</span>
          <span className="text-sm font-sans font-black uppercase text-[#111111] tracking-wide">{descriptor}</span>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${colors.badgeBg} ${colors.badgeText} border-current/20 shadow-2xs ${className}`}
        title={`${normScore}/10 · ${descriptor}: ${meaning}`}
      >
        <span className="font-black">{normScore}/10</span>
        <span className="opacity-75">•</span>
        <span className="uppercase tracking-wider text-[10px] font-sans font-extrabold">{descriptor}</span>
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-mono font-black',
    md: 'text-sm font-mono font-black px-2.5 py-1 rounded-lg',
    lg: 'text-xl font-mono font-black px-4 py-2 rounded-xl shadow-sm',
    xl: 'text-3xl font-mono font-black px-6 py-3 rounded-2xl shadow-md',
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div
        className={`${colors.bg} ${colors.text} ${sizeClasses[size]} flex items-center justify-center space-x-1 transition-all hover:scale-105 shadow-xs cursor-help`}
        title={`Abstract Score: ${normScore}/10 · ${descriptor} (${meaning})`}
      >
        <span>{normScore}</span>
        <span className="opacity-80 text-[0.7em] font-sans font-semibold">/10</span>
      </div>
      {showLabel && (
        <span
          className="text-[10px] font-sans font-black uppercase tracking-wider text-gray-800 mt-1.5 px-2.5 py-0.5 bg-white border border-gray-200/80 rounded-md text-center whitespace-nowrap shadow-2xs"
          title={meaning}
        >
          {descriptor}
        </span>
      )}
    </div>
  );
};

