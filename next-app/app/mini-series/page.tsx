import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { ReviewsArchiveView } from '@/components/reviews/ReviewsArchiveView';

export const metadata: Metadata = {
  title: 'Limited & Mini-Series Reviews — The Abstract Take',
  description: 'Uncompromising critique of self-contained limited series, novelistic television, and miniseries.',
  alternates: {
    canonical: 'https://theabstracttake.com/mini-series',
  },
};

export const revalidate = 3600;

interface MiniSeriesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MiniSeriesPage({ searchParams }: MiniSeriesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsByType('Mini Series', pageSize, offset);

  return (
    <ReviewsArchiveView
      title="Limited & Mini-Series"
      subtitle="Exhaustive critiques of tight, self-contained multi-part narratives and novelistic filmmaking."
      badge="Limited Series"
      reviews={reviews}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      basePath="/mini-series"
    />
  );
}
