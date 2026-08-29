import React from 'react';
import { tagRepository } from '@/lib/db/repositories/tagRepository';
import { TagsManager } from '@/components/admin/TagsManager';

export const dynamic = 'force-dynamic';

export default async function AdminTagsPage() {
  const tags = await tagRepository.getTags();

  return <TagsManager initialTags={tags} />;
}
