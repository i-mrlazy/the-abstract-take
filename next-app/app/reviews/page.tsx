import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { ReviewsArchiveView } from '@/components/reviews/ReviewsArchiveView';

export const metadata: Metadata = {
  title: 'All Critical Takes & Reviews — The Abstract Take',
  description: 'Browse the complete independent archive of film, series, and anime critiques scored on the authoritative Abstract Scale.',
  alternates: {
    canonical: 'https://theabstracttake.com/reviews',
  },
};

export const revalidate = 3600;

interface ReviewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsPaginated({
    limit: pageSize,
    offset,
  });

  return (
    <ReviewsArchiveView
      title="Complete Editorial Archives"
      subtitle="Uncompromising critical essays, ratings, and breakdowns across every watched film, series, and special."
      badge="Full Archive"
      reviews={reviews}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      basePath="/reviews"
    />
  );
}
