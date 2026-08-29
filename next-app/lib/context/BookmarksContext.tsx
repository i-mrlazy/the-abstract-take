'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Review } from '@/types';

interface BookmarksContextType {
  bookmarkedIds: string[];
  bookmarkedReviews: Review[];
  bookmarkedCount: number;
  isBookmarked: (id: string) => boolean;
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;
  toggleBookmark: (id: string) => void;
  clearBookmarks: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  isLoading: boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

const STORAGE_KEY = 'abstract_bookmarks';

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Client hydration of localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBookmarkedIds(parsed.filter((item) => typeof item === 'string'));
        }
      }
    } catch (e) {
      console.warn('Could not read abstract_bookmarks from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Fetch or sync review metadata for drawer display
  const fetchReviews = useCallback(async () => {
    if (allReviews.length > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        if (data.reviews && Array.isArray(data.reviews)) {
          setAllReviews(data.reviews);
        }
      }
    } catch (e) {
      console.error('Error loading reviews for bookmarks:', e);
    } finally {
      setIsLoading(false);
    }
  }, [allReviews.length]);

  // When drawer opens, ensure review metadata is fetched
  useEffect(() => {
    if (isDrawerOpen) {
      fetchReviews();
    }
  }, [isDrawerOpen, fetchReviews]);

  // 3. Persist changes to localStorage (only after initial hydration)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.error('Could not save abstract_bookmarks to localStorage:', e);
    }
  }, [bookmarkedIds, isHydrated]);

  const isBookmarked = useCallback(
    (id: string) => bookmarkedIds.includes(id),
    [bookmarkedIds]
  );

  const addBookmark = useCallback((id: string) => {
    if (!id) return;
    setBookmarkedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => prev.filter((item) => item !== id));
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    if (!id) return;
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarkedIds([]);
  }, []);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const bookmarkedReviews = useMemo(() => {
    return allReviews.filter((r) => bookmarkedIds.includes(r.id));
  }, [allReviews, bookmarkedIds]);

  const value = useMemo(
    () => ({
      bookmarkedIds,
      bookmarkedReviews,
      bookmarkedCount: bookmarkedIds.length,
      isBookmarked,
      addBookmark,
      removeBookmark,
      toggleBookmark,
      clearBookmarks,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      isLoading,
    }),
    [
      bookmarkedIds,
      bookmarkedReviews,
      isBookmarked,
      addBookmark,
      removeBookmark,
      toggleBookmark,
      clearBookmarks,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      isLoading,
    ]
  );

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
