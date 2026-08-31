import React from 'react';
import Link from 'next/link';
import { Review } from '../../types';
import { AbstractScoreBadge } from './AbstractScoreBadge';
import { BookmarkButton } from '../bookmarks/BookmarkButton';
import { ReviewArtwork } from './ReviewArtwork';
import { Clock } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
  priority?: boolean;
}

export function ReviewCard({ review, priority = false }: ReviewCardProps) {
  return (
    <article className="group bg-white border border-gray-200/90 rounded-2xl overflow-hidden hover:border-[#008CFF]/50 hover:shadow-md transition-all duration-200 flex flex-col h-full justify-between min-w-0">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-900 shrink-0">
        <Link href={`/reviews/${review.slug}`} className="block w-full h-full">
          <ReviewArtwork
            title={review.title}
            releaseYear={review.releaseYear}
            type={review.type}
            slug={review.slug}
            posterUrl={review.posterUrl}
            bannerUrl={review.bannerUrl}
            artwork={review.artwork}
            abstractScore={review.abstractScore}
            aspectRatio="auto"
            alt={review.posterAlt || review.title}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>
        <div className="absolute top-3 left-3 z-10">
          <BookmarkButton reviewId={review.id} size="sm" />
        </div>
        <div className="absolute top-3 right-3 z-10">
          <AbstractScoreBadge score={review.abstractScore} size="sm" />
        </div>
        <div className="absolute bottom-3 left-3 bg-[#111111]/85 backdrop-blur-xs text-white text-[11px] font-mono px-2.5 py-1 rounded-lg uppercase tracking-wider pointer-events-none">
          {review.type}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-500 min-w-0">
            <span className="shrink-0">{review.releaseYear}</span>
            <span className="shrink-0">•</span>
            <span className="truncate min-w-0">{review.director}</span>
          </div>

          <h3 className="font-serif font-black text-lg text-gray-900 leading-snug group-hover:text-[#008CFF] transition-colors line-clamp-2 min-w-0 break-words">
            <Link href={`/reviews/${review.slug}`}>{review.title}</Link>
          </h3>

          <p className="font-news text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {review.myTake || review.verdictText}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-500 shrink-0">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{review.readingTimeMinutes || 4}m read</span>
          </div>
          <Link
            href={`/reviews/${review.slug}`}
            className="font-bold text-[#008CFF] hover:underline flex items-center space-x-1 shrink-0"
          >
            <span>Read Take →</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
