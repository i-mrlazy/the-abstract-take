'use client';

import React, { useState } from 'react';
import { Review, RecommendationList, Comment, AnalyticsSummary } from '@/types';
import { DashboardOverview } from './DashboardOverview';

interface AdminDashboardClientProps {
  initialReviews: Review[];
  initialRecommendations: RecommendationList[];
  initialComments: Comment[];
  initialAnalytics: AnalyticsSummary;
}

export function AdminDashboardClient({
  initialReviews,
  initialRecommendations,
  initialComments,
  initialAnalytics,
}: AdminDashboardClientProps) {
  const [reviews] = useState<Review[]>(initialReviews);
  const [recommendationLists] = useState<RecommendationList[]>(initialRecommendations);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [analytics] = useState<AnalyticsSummary>(initialAnalytics);

  const handleApproveComment = async (id: string) => {
    try {
      const res = await fetch(`/api/comments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: 'approved' } : c))
        );
      }
    } catch (err) {
      console.error('Approve comment error:', err);
    }
  };

  return (
    <DashboardOverview
      reviews={reviews}
      recommendationLists={recommendationLists}
      comments={comments}
      analytics={analytics}
      onApproveComment={handleApproveComment}
    />
  );
}
