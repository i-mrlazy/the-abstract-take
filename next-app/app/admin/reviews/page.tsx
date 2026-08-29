import React from 'react';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { ReviewsTable } from '@/components/admin/ReviewsTable';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const reviews = await reviewRepository.getAll(true);

  return <ReviewsTable initialReviews={reviews} />;
}
