import React from 'react';
import { subscriberRepository } from '@/lib/db/repositories/subscriberRepository';
import { NewsletterManager } from '@/components/admin/NewsletterManager';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletterPage() {
  const subscribers = await subscriberRepository.getAll();

  return <NewsletterManager initialSubscribers={subscribers} />;
}
