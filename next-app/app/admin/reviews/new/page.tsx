import React from 'react';
import { tagRepository } from '@/lib/db/repositories/tagRepository';
import { ReviewEditor } from '@/components/admin/ReviewEditor';

export const dynamic = 'force-dynamic';

export default async function NewReviewPage() {
  const tags = await tagRepository.getTags();

  return <ReviewEditor availableTags={tags} />;
}
