import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ReviewsArchiveView } from '@/components/reviews/ReviewsArchiveView';

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export const revalidate = 3600;

import { buildTagMetadata } from '@/lib/seo/metadata';

function unslugify(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tagName = unslugify(slug);
  const { total } = await db.getReviewsByTag(slug, 1, 0);

  return buildTagMetadata(tagName, slug, total);
}

export default async function TagArchivePage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const page = Math.max(1, Number(search.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsByTag(slug, pageSize, offset);

  if (total === 0 && page === 1) {
    notFound();
  }

  const tagName = unslugify(slug);

  return (
    <ReviewsArchiveView
      title={`Tagged: #${tagName}`}
      subtitle={`Curated editorial reviews and takes exploring the #${tagName} theme.`}
      badge={`Tag: #${tagName}`}
      reviews={reviews}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      basePath={`/tags/${slug}`}
    />
  );
}
