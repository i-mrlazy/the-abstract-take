import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { SearchFilterBar } from '@/components/search/SearchFilterBar';
import { ReviewCard } from '@/components/ui/ReviewCard';
import { Search, Film } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Search Reviews & Critiques — The Abstract Take',
  description: 'Search The Abstract Take cinema archives by title, director, format, genre, and score.',
  robots: {
    index: false,
    follow: true,
  },
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    minScore?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type || '';
  const minScore = params.minScore ? Number(params.minScore) : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsPaginated({
    search: query,
    type,
    minScore,
    limit: pageSize,
    offset,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Header */}
      <header className="border-b border-gray-200/80 pb-6">
        <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-gray-950 tracking-tight">
          Search Archives
        </h1>
        <p className="font-news text-base sm:text-lg text-gray-600 max-w-2xl mt-2 leading-relaxed">
          Query the entire publication database by title, filmmaker, genre, format, or rating threshold.
        </p>
      </header>

      {/* Interactive Search Bar (Client Island wrapped in Suspense) */}
      <Suspense fallback={<div className="h-24 bg-white rounded-3xl animate-pulse" />}>
        <SearchFilterBar
          initialQuery={query}
          initialType={type}
          initialMinScore={params.minScore}
        />
      </Suspense>

      {/* Search Results Summary */}
      <div className="text-xs font-mono text-gray-500">
        {query || type || minScore ? (
          <span>
            Found <strong className="text-gray-900">{total}</strong> {total === 1 ? 'match' : 'matches'}{' '}
            {query ? `for "${query}"` : ''}
          </span>
        ) : (
          <span>Showing all {total} reviews in archive</span>
        )}
      </div>

      {/* Grid or Empty Results */}
      {reviews.length === 0 ? (
        <div className="py-16 text-center bg-white border border-gray-200 rounded-3xl p-8">
          <Film className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-serif font-bold text-xl text-gray-900 mb-2">No Matching Takes</h3>
          <p className="font-news text-gray-600 max-w-md mx-auto">
            We couldn't find any reviews matching your query. Try broadening your keywords or resetting active filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
