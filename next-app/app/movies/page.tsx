import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { ReviewsArchiveView } from '@/components/reviews/ReviewsArchiveView';

export const metadata: Metadata = {
  title: 'Film Reviews & Cinema Critiques — The Abstract Take',
  description: 'Unfiltered, authoritative film reviews across contemporary releases, classics, and festival selections.',
  alternates: {
    canonical: 'https://theabstracttake.com/movies',
  },
};

export const revalidate = 3600;

interface MoviesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsByType('Movie', pageSize, offset);

  return (
    <ReviewsArchiveView
      title="Cinema & Feature Films"
      subtitle="Deep-dive critical reviews on feature filmmaking, cinematography, writing, and auteur direction."
      badge="Movies"
      reviews={reviews}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      basePath="/movies"
    />
  );
}
