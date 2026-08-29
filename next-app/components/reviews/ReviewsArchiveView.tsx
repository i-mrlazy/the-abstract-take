import React from 'react';
import Link from 'next/link';
import { Review } from '@/types';
import { ReviewCard } from '@/components/ui/ReviewCard';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReviewsArchiveViewProps {
  title: string;
  subtitle: string;
  badge?: string;
  reviews: Review[];
  total: number;
  currentPage?: number;
  pageSize?: number;
  basePath: string;
  emptyMessage?: string;
}

export function ReviewsArchiveView({
  title,
  subtitle,
  badge,
  reviews,
  total,
  currentPage = 1,
  pageSize = 12,
  basePath,
  emptyMessage = 'No editorial reviews found in this archive.',
}: ReviewsArchiveViewProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Archive Header */}
      <header className="border-b border-gray-200/80 pb-6">
        {badge && (
          <span className="inline-block px-3 py-1 bg-[#008CFF]/10 text-[#008CFF] rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-3">
            {badge}
          </span>
        )}
        <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-gray-950 tracking-tight">
          {title}
        </h1>
        <p className="font-news text-base sm:text-lg text-gray-600 max-w-2xl mt-2 leading-relaxed">
          {subtitle}
        </p>
        <div className="mt-4 text-xs font-mono text-gray-500">
          Showing {reviews.length} of {total} {total === 1 ? 'critical take' : 'critical takes'}
        </div>
      </header>

      {/* Grid or Empty State */}
      {reviews.length === 0 ? (
        <div className="py-16 text-center bg-white border border-gray-200 rounded-3xl p-8">
          <Film className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-serif font-bold text-xl text-gray-900 mb-2">Archive Empty</h3>
          <p className="font-news text-gray-600 max-w-md mx-auto mb-6">{emptyMessage}</p>
          <Link
            href="/movies"
            className="inline-flex px-5 py-2.5 bg-[#008CFF] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#0077dd] transition-colors"
          >
            Explore Cinema Archives
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Server-Rendered Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between pt-8 border-t border-gray-200/80" aria-label="Pagination">
          {hasPrev ? (
            <Link
              href={`${basePath}?page=${currentPage - 1}`}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 hover:border-[#008CFF] transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREVIOUS</span>
            </Link>
          ) : (
            <div className="opacity-40 px-4 py-2.5 border border-transparent text-xs font-mono font-bold text-gray-400">
              PREVIOUS
            </div>
          )}

          <span className="text-xs font-mono text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          {hasNext ? (
            <Link
              href={`${basePath}?page=${currentPage + 1}`}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 hover:border-[#008CFF] transition-colors shadow-2xs"
            >
              <span>NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="opacity-40 px-4 py-2.5 border border-transparent text-xs font-mono font-bold text-gray-400">
              NEXT
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
