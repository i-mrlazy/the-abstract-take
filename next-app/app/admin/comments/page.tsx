import React from 'react';
import { commentRepository } from '@/lib/db/repositories/commentRepository';
import { CommentsModerator } from '@/components/admin/CommentsModerator';

export const dynamic = 'force-dynamic';

export default async function AdminCommentsPage() {
  const comments = await commentRepository.getAll(true);

  return <CommentsModerator initialComments={comments} />;
}
