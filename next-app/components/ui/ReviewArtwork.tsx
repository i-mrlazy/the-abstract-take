'use client';

import React, { useState } from 'react';
import { Film, Sparkles, Tv, Clapperboard } from 'lucide-react';
import { resolveReviewArtwork, isPlaceholderArtwork } from '@/lib/editorial/reviewArtwork';
import { ArtworkMetadata, MediaType } from '@/types';

export interface ReviewArtworkProps {
  title?: string;
  releaseYear?: number;
  type?: MediaType | string;
  slug?: string;
  posterUrl?: string;
  bannerUrl?: string;
  artwork?: ArtworkMetadata;
  abstractScore?: number;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | 'auto';
  preferredType?: 'poster' | 'backdrop';
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
}

export const ReviewArtwork: React.FC<ReviewArtworkProps> = ({
  title = 'Featured Critique',
  releaseYear,
  type = 'Movie',
  slug,
  posterUrl,
  bannerUrl,
  artwork,
  abstractScore,
  aspectRatio = 'portrait',
  preferredType = 'poster',
  alt,
  className = '',
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Centralized asset resolution
  const resolved = resolveReviewArtwork(
    { slug, title, releaseYear, posterUrl, bannerUrl, artwork },
    preferredType
  );

  const shouldRenderFallback = hasError || !resolved.url || isPlaceholderArtwork(resolved.url);

  // Aspect ratio classes
  const aspectClass =
    aspectRatio === 'portrait'
      ? 'aspect-[2/3]'
      : aspectRatio === 'landscape'
      ? 'aspect-[16/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : '';

  if (shouldRenderFallback) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0B0F19] via-[#0D1527] to-[#050811] flex flex-col justify-between p-4 border border-gray-800/80 select-none ${aspectClass} ${className}`}
        aria-label={alt || `${title} artwork placeholder`}
      >
        {/* Background Film Aesthetic Grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#008CFF_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#008CFF]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Moniker & Type */}
        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-[#008CFF]" />
            <span className="text-[9px] font-mono tracking-widest uppercase font-black text-cyan-400">
              THE ABSTRACT TAKE
            </span>
          </div>
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
            {type}
          </span>
        </div>

        {/* Center Title & Year */}
        <div className="relative z-10 my-auto py-3">
          <h4 className="font-serif font-black text-white text-base sm:text-lg leading-tight line-clamp-3 mb-1">
            {title}
          </h4>
          {releaseYear && (
            <p className="text-xs font-mono text-gray-400 flex items-center space-x-1">
              <Film className="w-3 h-3 text-gray-500" />
              <span>Release: {releaseYear}</span>
            </p>
          )}
        </div>

        {/* Bottom Abstract Score Badge */}
        <div className="relative z-10 flex items-center justify-between pt-2.5 border-t border-white/10">
          <span className="text-[9px] font-mono uppercase text-gray-500">
            Editorial Archive
          </span>
          {typeof abstractScore === 'number' && abstractScore > 0 ? (
            <div className="flex items-center space-x-1 bg-[#008CFF]/15 border border-[#008CFF]/30 px-2 py-0.5 rounded-full">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                Score:
              </span>
              <span className="text-xs font-mono font-black text-white">
                {abstractScore}/10
              </span>
            </div>
          ) : (
            <span className="text-[9px] font-mono text-cyan-400/80">Authoritative Review</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-900 ${aspectClass} ${className}`}>
      {/* Background loading shimmer */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center">
          <Film className="w-6 h-6 text-gray-700 animate-spin" />
        </div>
      )}

      <img
        src={resolved.url}
        alt={alt || `${title} (${releaseYear || ''}) ${preferredType === 'backdrop' ? 'Cinematic Backdrop' : 'Official Poster'}`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
