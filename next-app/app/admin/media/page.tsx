import React from 'react';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { settingsRepository } from '@/lib/db/repositories/settingsRepository';
import { MediaLibrary } from '@/components/admin/MediaLibrary';

export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  const [reviews, settings] = await Promise.all([
    reviewRepository.getAll(true),
    settingsRepository.getSettings(),
  ]);

  const imageSet = new Set<string>();
  if (settings.defaultOgImage) imageSet.add(settings.defaultOgImage);
  if (settings.creatorAvatar) imageSet.add(settings.creatorAvatar);

  for (const r of reviews) {
    if (r.posterUrl) imageSet.add(r.posterUrl);
    if (r.bannerUrl) imageSet.add(r.bannerUrl);
  }

  return <MediaLibrary initialImages={Array.from(imageSet)} />;
}
