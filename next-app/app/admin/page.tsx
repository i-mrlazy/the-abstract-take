import React from 'react';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { recommendationRepository } from '@/lib/db/repositories/recommendationRepository';
import { commentRepository } from '@/lib/db/repositories/commentRepository';
import { analyticsRepository } from '@/lib/db/repositories/analyticsRepository';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [reviews, recommendationLists, comments, analytics] = await Promise.all([
    reviewRepository.getAll(true),
    recommendationRepository.getAll(true),
    commentRepository.getAll(true),
    analyticsRepository.getSummary(),
  ]);

  return (
    <AdminDashboardClient
      initialReviews={reviews}
      initialRecommendations={recommendationLists}
      initialComments={comments}
      initialAnalytics={analytics}
    />
  );
}
