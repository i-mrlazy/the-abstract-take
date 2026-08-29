import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ReviewsArchiveView } from '@/components/reviews/ReviewsArchiveView';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export const revalidate = 3600;

import { buildCategoryMetadata } from '@/lib/seo/metadata';

function unslugify(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = unslugify(slug);
  const { total } = await db.getReviewsByCategory(slug, 1, 0);

  return buildCategoryMetadata(categoryName, slug, total);
}

export default async function CategoryArchivePage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const page = Math.max(1, Number(search.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const { reviews, total } = await db.getReviewsByCategory(slug, pageSize, offset);

  if (total === 0 && page === 1) {
    notFound();
  }

  const categoryName = unslugify(slug);

  return (
    <ReviewsArchiveView
      title={`${categoryName} Critiques`}
      subtitle={`Curated critical takes, rankings, and essays categorized under ${categoryName}.`}
      badge={`Genre: ${categoryName}`}
      reviews={reviews}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      basePath={`/category/${slug}`}
    />
  );
}
