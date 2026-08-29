import React from 'react';
import { recommendationRepository } from '@/lib/db/repositories/recommendationRepository';
import { RecommendationsManager } from '@/components/admin/RecommendationsManager';

export const dynamic = 'force-dynamic';

export default async function AdminRecommendationsPage() {
  const lists = await recommendationRepository.getAll(true);

  return <RecommendationsManager initialLists={lists} />;
}
