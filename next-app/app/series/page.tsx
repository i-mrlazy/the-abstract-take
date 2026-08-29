import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { ReviewsArchiveView } from '@/components/reviews/ReviewsArchiveView';

export const metadata: Metadata = {
  title: 'Series & Television Reviews — The Abstract Take',
  description: 'In-depth television critiques, season analyses, and episodic storytelling appraisals.',
  alternates: {
    canonical: 'https://theabstracttake.com/series',
  },
};

export const revalidate = 3600;

interface SeriesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SeriesPage({ searchParams }: SeriesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsByType('Series', pageSize, offset);

  return (
    <ReviewsArchiveView
      title="Series & Television"
      subtitle="Comprehensive season assessments, narrative arc dissections, and prestige TV appraisals."
      badge="Television"
      reviews={reviews}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      basePath="/series"
    />
  );
}
