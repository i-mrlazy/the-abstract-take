import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { ReviewsArchiveView } from '@/components/reviews/ReviewsArchiveView';

export const metadata: Metadata = {
  title: 'Anime Reviews & Critiques — The Abstract Take',
  description: 'Uncompromising anime critiques spanning landmark adaptations, auteur films, and seasonal standouts.',
  alternates: {
    canonical: 'https://theabstracttake.com/anime',
  },
};

export const revalidate = 3600;

interface AnimePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AnimePage({ searchParams }: AnimePageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsByType('Anime', pageSize, offset);

  return (
    <ReviewsArchiveView
      title="Anime Critiques"
      subtitle="Serious artistic appraisals of animation craft, narrative thematic depth, and iconic Japanese cinema."
      badge="Anime"
      reviews={reviews}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      basePath="/anime"
    />
  );
}
