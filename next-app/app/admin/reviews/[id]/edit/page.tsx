import React from 'react';
import { notFound } from 'next/navigation';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { tagRepository } from '@/lib/db/repositories/tagRepository';
import { ReviewEditor } from '@/components/admin/ReviewEditor';

export const dynamic = 'force-dynamic';

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [review, tags] = await Promise.all([
    reviewRepository.getById(id).then((r) => r || reviewRepository.getBySlug(id)),
    tagRepository.getTags(),
  ]);

  if (!review) {
    notFound();
  }

  return <ReviewEditor initialReview={review} availableTags={tags} />;
}
