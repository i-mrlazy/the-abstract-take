import React from 'react';
import { settingsRepository } from '@/lib/db/repositories/settingsRepository';
import { SettingsManager } from '@/components/admin/SettingsManager';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await settingsRepository.getSettings();

  return <SettingsManager initialSettings={settings} />;
}
