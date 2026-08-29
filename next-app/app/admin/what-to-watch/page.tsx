import React from 'react';
import { whatNextRepository } from '@/lib/db/repositories/whatNextRepository';
import { WhatToWatchNextManager } from '@/components/admin/WhatToWatchNextManager';

export const dynamic = 'force-dynamic';

export default async function AdminWhatToWatchPage() {
  const items = await whatNextRepository.getAll();

  return <WhatToWatchNextManager initialItems={items} />;
}
