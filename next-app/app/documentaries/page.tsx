import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { ReviewsArchiveView } from '@/components/reviews/ReviewsArchiveView';

export const metadata: Metadata = {
  title: 'Documentary Reviews — The Abstract Take',
  description: 'Critical analysis of non-fiction storytelling, investigative cinema, and cultural retrospectives.',
  alternates: {
    canonical: 'https://theabstracttake.com/documentaries',
  },
};

export const revalidate = 3600;

interface DocumentariesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DocumentariesPage({ searchParams }: DocumentariesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsByType('Documentary', pageSize, offset);

  return (
    <ReviewsArchiveView
      title="Documentaries & Non-Fiction"
      subtitle="Critical assessments of truth, journalism, and artistic representation in non-fiction film."
      badge="Documentaries"
      reviews={reviews}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      basePath="/documentaries"
    />
  );
}
