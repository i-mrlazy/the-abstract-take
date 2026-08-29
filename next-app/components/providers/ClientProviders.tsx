'use client';

import React from 'react';
import { BookmarksProvider } from '@/lib/context/BookmarksContext';
import { BookmarksDrawer } from '../bookmarks/BookmarksDrawer';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BookmarksProvider>
      {children}
      <BookmarksDrawer />
    </BookmarksProvider>
  );
}
