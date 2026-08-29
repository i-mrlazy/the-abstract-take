import React from 'react';
import Link from 'next/link';
import { Review } from '../../types';
import { AbstractScoreBadge } from './AbstractScoreBadge';
import { Clock, Calendar } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
  priority?: boolean;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="group bg-white border border-gray-200/90 rounded-2xl overflow-hidden hover:border-[#008CFF]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <Link href={`/reviews/${review.slug}`} className="block relative aspect-16/10 overflow-hidden bg-gray-100">
        <img
          src={review.posterUrl}
          alt={review.posterAlt || review.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute top-3 right-3">
          <AbstractScoreBadge score={review.abstractScore} size="sm" />
        </div>
        <div className="absolute bottom-3 left-3 bg-[#111111]/85 backdrop-blur-xs text-white text-[11px] font-mono px-2.5 py-1 rounded-lg uppercase tracking-wider">
          {review.type}
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-500 mb-2">
            <span>{review.releaseYear}</span>
            <span>•</span>
            <span className="truncate">{review.director}</span>
          </div>

          <h3 className="font-serif font-black text-lg text-gray-900 leading-snug group-hover:text-[#008CFF] transition-colors mb-2">
            <Link href={`/reviews/${review.slug}`}>{review.title}</Link>
          </h3>

          <p className="font-news text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {review.myTake}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{review.readingTimeMinutes}m read</span>
          </div>
          <span className="font-bold text-[#008CFF] group-hover:underline">Read Take →</span>
        </div>
      </div>
    </article>
  );
}
