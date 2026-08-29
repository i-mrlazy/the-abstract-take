import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { ReviewsArchiveView } from '@/components/reviews/ReviewsArchiveView';

export const metadata: Metadata = {
  title: 'Specials & Short Films — The Abstract Take',
  description: 'Reviews of cinema specials, standalone episodes, comedy specials, and short-form storytelling.',
  alternates: {
    canonical: 'https://theabstracttake.com/specials',
  },
};

export const revalidate = 3600;

interface SpecialsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SpecialsPage({ searchParams }: SpecialsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsByType('Special', pageSize, offset);

  return (
    <ReviewsArchiveView
      title="Specials & Standalone Works"
      subtitle="Critiques of cinematic one-offs, experimental shorts, and landmark television specials."
      badge="Specials"
      reviews={reviews}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      basePath="/specials"
    />
  );
}
