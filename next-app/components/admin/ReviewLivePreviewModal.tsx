'use client';

import React, { useState } from 'react';
import { Review } from '@/types';
import { normalizeScore, getQualityLabel, getRatingColorClasses } from '@/lib/utils/rating';
import {
  X,
  Smartphone,
  Monitor,
  Flame,
  Check,
  X as XIcon,
  Quote,
  AlertTriangle,
} from 'lucide-react';

interface ReviewLivePreviewModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewLivePreviewModal({ review, isOpen, onClose }: ReviewLivePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showSpoiler, setShowSpoiler] = useState(false);

  if (!isOpen) return null;

  const scoreNorm = normalizeScore(review.abstractScore);
  const scoreLabel = getQualityLabel(scoreNorm);
  const colorClasses = getRatingColorClasses(scoreNorm);

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-6xl bg-white border border-gray-200/90 rounded-2xl p-3 mb-3 flex items-center justify-between shadow-lg text-gray-900">
        <div className="flex items-center space-x-3">
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold rounded-lg uppercase">
            Live Preview Mode ({(review.status || 'draft').toUpperCase()})
          </span>
          <span className="text-xs font-mono text-gray-500 hidden sm:inline">
            {review.title} ({review.releaseYear})
          </span>
        </div>

        {/* Viewport Toggles */}
        <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              deviceMode === 'desktop'
                ? 'bg-white text-gray-900 font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop View</span>
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-white text-gray-900 font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile (390px)</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Frame Container */}
      <div
        className={`bg-[#FAF9F6] text-[#111111] rounded-2xl border border-gray-200 overflow-y-auto max-h-[85vh] transition-all duration-300 shadow-2xl ${
          deviceMode === 'desktop' ? 'w-full max-w-6xl' : 'w-[400px]'
        }`}
      >
        {/* Mock Article View */}
        <article className="pb-16">
          {/* Hero Banner */}
          <div className="relative w-full h-[280px] md:h-[420px] bg-black">
            <img
              src={review.bannerUrl || review.posterUrl}
              alt={review.title}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-black/40 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 text-white max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-[#008CFF] text-white font-mono font-bold text-xs rounded-lg shadow-2xs">
                    {review.type}
                  </span>
                  <span className="px-2.5 py-0.5 bg-black/70 text-white font-mono text-xs rounded-lg border border-white/20">
                    {review.releaseYear}
                  </span>
                  <span className="px-2.5 py-0.5 bg-black/70 text-white font-mono text-xs rounded-lg border border-white/20">
                    {review.runtime}
                  </span>
                </div>
                <h1 className="font-serif font-black text-2xl md:text-4xl text-white tracking-tight">
                  {review.title}
                </h1>
                {review.originalTitle && review.originalTitle !== review.title && (
                  <p className="font-serif italic text-gray-300 text-sm mt-0.5">
                    Original Title: {review.originalTitle}
                  </p>
                )}
                <p className="text-xs font-mono text-gray-300 mt-2">
                  Directed by <span className="text-white font-bold">{review.director}</span>
                </p>
              </div>

              {/* Abstract Score Block */}
              <div className="bg-white text-gray-900 border border-gray-200 p-4 rounded-2xl text-center shadow-lg shrink-0">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-[#008CFF] font-bold">
                  Abstract Score
                </span>
                <span className="font-serif font-black text-3xl md:text-4xl text-gray-900">
                  {scoreNorm}
                  <span className="text-sm text-gray-400 font-sans">/10</span>
                </span>
                <span
                  className={`block text-[11px] font-bold mt-1 px-2.5 py-0.5 rounded-lg border ${colorClasses.badgeBg} ${colorClasses.badgeText} ${colorClasses.border}`}
                >
                  {scoreLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Article Container */}
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* The Abstract Take Editorial Hook */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-6 mb-8 shadow-sm">
              <div className="flex items-center space-x-2 text-[#008CFF] text-xs font-mono font-bold uppercase mb-2">
                <Flame className="w-4 h-4 text-[#008CFF]" />
                <span>My Take (Executive Thesis)</span>
              </div>
              <p className="font-serif font-bold text-lg md:text-xl leading-relaxed text-gray-900">
                "{review.myTake}"
              </p>
            </div>

            {/* Pros and Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-sm">
                <h4 className="font-mono text-xs uppercase tracking-wider text-emerald-800 font-bold mb-3 flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>What Worked</span>
                </h4>
                <ul className="space-y-2">
                  {review.pros.map((pro, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-rose-200/80 rounded-2xl p-5 shadow-sm">
                <h4 className="font-mono text-xs uppercase tracking-wider text-rose-800 font-bold mb-3 flex items-center space-x-1.5">
                  <XIcon className="w-4 h-4 text-rose-600" />
                  <span>What Didn't</span>
                </h4>
                <ul className="space-y-2">
                  {review.cons.map((con, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start space-x-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Long Form Critique */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-6 md:p-8 mb-8 shadow-sm space-y-4">
              <h3 className="font-serif font-black text-xl text-gray-900 border-b border-gray-100 pb-3">
                Full Editorial Critique
              </h3>
              <div className="font-serif text-base text-gray-800 leading-relaxed whitespace-pre-line">
                {review.longFormReview}
              </div>
            </div>

            {/* Standout Sequence & Quote */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {review.favoriteScene && (
                <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#008CFF] font-bold block mb-1">
                    Standout Sequence
                  </span>
                  <p className="text-xs text-gray-800 font-sans italic">{review.favoriteScene}</p>
                </div>
              )}
              {review.favoriteQuote && (
                <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#008CFF] font-bold block mb-1 flex items-center space-x-1">
                    <Quote className="w-3 h-3 text-[#008CFF]" />
                    <span>Key Line of Dialogue</span>
                  </span>
                  <p className="text-xs text-gray-800 font-serif italic">"{review.favoriteQuote}"</p>
                </div>
              )}
            </div>

            {/* Spoiler Analysis Section */}
            {review.spoilerSection && (
              <div className="bg-white text-gray-900 border border-rose-200 rounded-2xl p-6 mb-8 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="font-mono text-xs font-bold text-rose-700 uppercase tracking-wider">
                      Spoiler Analysis & Climax Breakdown
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSpoiler(!showSpoiler)}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-[11px] font-mono text-rose-700 transition-colors cursor-pointer"
                  >
                    {showSpoiler ? 'Hide Spoilers' : 'Reveal Spoilers'}
                  </button>
                </div>
                {showSpoiler ? (
                  <p className="font-serif text-xs md:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {review.spoilerSection}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Spoiler analysis hidden. Click reveal to read climax breakdown.
                  </p>
                )}
              </div>
            )}

            {/* Final Verdict */}
            <div className="bg-white text-gray-900 border border-gray-200/90 rounded-2xl p-6 shadow-sm text-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#008CFF] font-bold block mb-1">
                The Final Verdict
              </span>
              <p className="font-serif font-bold text-base md:text-lg text-gray-900 mb-4">
                "{review.verdictText}"
              </p>
              <div className="inline-flex items-center space-x-2 bg-[#008CFF] text-white font-mono font-bold text-xs px-4 py-2 rounded-xl shadow-xs">
                <span>Should You Watch:</span>
                <span className="uppercase">{review.shouldYouWatch}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
