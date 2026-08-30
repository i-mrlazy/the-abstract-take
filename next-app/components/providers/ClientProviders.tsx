'use client';

import React from 'react';
import { BookmarksProvider } from '@/lib/context/BookmarksContext';
import { AiConciergeProvider } from '@/lib/context/AiConciergeContext';
import { BookmarksDrawer } from '../bookmarks/BookmarksDrawer';
import { AiConciergeModal } from '../ai/AiConciergeModal';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BookmarksProvider>
      <AiConciergeProvider>
        {children}
        <BookmarksDrawer />
        <AiConciergeModal />
      </AiConciergeProvider>
    </BookmarksProvider>
  );
}
