import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Review, RecommendationList, Comment, AnalyticsSummary } from './types';
import { INITIAL_REVIEWS, INITIAL_RECOMMENDATION_LISTS, INITIAL_COMMENTS, INITIAL_ANALYTICS } from './data/mockData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { api } from './utils/api';
import { TopNavbar } from './components/TopNavbar';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { AiConciergeModal } from './components/AiConciergeModal';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { HomePage } from './pages/HomePage';
import { ReviewDetailPage } from './pages/ReviewDetailPage';
import { RecommendsPage } from './pages/RecommendsPage';
import { ReviewsListPage } from './pages/ReviewsListPage';
import { WhatToWatchNextPage } from './pages/WhatToWatchNextPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminCmsPage } from './pages/AdminCmsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

function AppRoutes() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Public Data State
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [recommendationLists, setRecommendationLists] = useState<RecommendationList[]>(INITIAL_RECOMMENDATION_LISTS);

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiConciergeOpen, setIsAiConciergeOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  // User Local Storage Persistence for Bookmarks & Likes
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('abstract_bookmarks');
      return saved ? JSON.parse(saved) : ['review-1'];
    } catch {
      return ['review-1'];
    }
  });

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('abstract_likes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load public reviews and recommendations on mount
  const fetchPublicData = useCallback(async () => {
    try {
      const [fetchedReviews, fetchedRecs] = await Promise.all([
        api.getReviews(),
        api.getRecommendations(),
      ]);
      if (fetchedReviews && fetchedReviews.length > 0) {
        setReviews(fetchedReviews);
      }
      if (fetchedRecs && fetchedRecs.length > 0) {
        setRecommendationLists(fetchedRecs);
      }
    } catch (e) {
      console.warn('Using local dataset fallback:', e);
    }
  }, []);

  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

  useEffect(() => {
    try {
      localStorage.setItem('abstract_bookmarks', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.error(e);
    }
  }, [bookmarkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem('abstract_likes', JSON.stringify(likedIds));
    } catch (e) {
      console.error(e);
    }
  }, [likedIds]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const bookmarkedReviews = reviews.filter((r) => bookmarkedIds.includes(r.id));
  // Handle Admin Layout & Route Protection
  if (isAdminRoute) {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="w-8 h-8 border-3 border-[#008CFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <AdminLoginPage
          onSuccess={() => navigate('/admin')}
          onBackToSite={() => navigate('/')}
        />
      );
    }

    if (!isAdmin) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAF9F6] text-center space-y-4">
          <h1 className="font-serif font-black text-3xl text-red-600">Access Denied</h1>
          <p className="font-news text-sm text-gray-600 max-w-md">
            Your account does not have administrator privileges to access The Abstract Take Editorial Studio.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-[#111111] text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer hover:bg-[#008CFF] transition-colors"
          >
            Return to Public Website
          </button>
        </div>
      );
    }

    return (
      <AdminCmsPage
        onClose={() => {
          navigate('/');
          fetchPublicData();
        }}
        onRefreshPublicData={fetchPublicData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] selection:bg-[#00C0FF] selection:text-black flex flex-col">
      {/* Top Navbar */}
      <TopNavbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAiConcierge={() => setIsAiConciergeOpen(true)}
        bookmarkedCount={bookmarkedIds.length}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenAdmin={() => navigate('/admin')}
      />

      {/* Main Routed Content */}
      <main className="flex-1">
        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={
              <HomePage
                reviews={reviews}
                recommendationLists={recommendationLists}
                onOpenAiConcierge={() => setIsAiConciergeOpen(true)}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />

          {/* Unified Reviews Archive & Media Type Listings */}
          <Route
            path="/reviews"
            element={
              <ReviewsListPage
                reviews={reviews}
                defaultTypeFilter="All"
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />
          <Route
            path="/movies"
            element={
              <ReviewsListPage
                reviews={reviews}
                defaultTypeFilter="Movie"
                pageTitle="Movie Reviews"
                pageSubtitle="Personal critiques and 1–10 Abstract Scores for feature films."
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />
          <Route
            path="/series"
            element={
              <ReviewsListPage
                reviews={reviews}
                defaultTypeFilter="Series"
                pageTitle="Television & Series Reviews"
                pageSubtitle="In-depth season breakdowns and critiques for drama, comedy, and limited series."
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />
          <Route
            path="/anime"
            element={
              <ReviewsListPage
                reviews={reviews}
                defaultTypeFilter="Anime"
                pageTitle="Anime & Animation Reviews"
                pageSubtitle="Critiques of cinematic anime masterpieces, series, and auteur animation."
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />
          <Route
            path="/documentaries"
            element={
              <ReviewsListPage
                reviews={reviews}
                defaultTypeFilter="Documentary"
                pageTitle="Documentary Reviews"
                pageSubtitle="Non-fiction cinema, investigative documentaries, and historical essays."
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />
          <Route
            path="/mini-series"
            element={
              <ReviewsListPage
                reviews={reviews}
                defaultTypeFilter="Mini Series"
                pageTitle="Mini Series Reviews"
                pageSubtitle="Limited series and complete narrative story arcs."
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />
          <Route
            path="/specials"
            element={
              <ReviewsListPage
                reviews={reviews}
                defaultTypeFilter="Special"
                pageTitle="Specials & Event Television"
                pageSubtitle="Standout television specials, live performances, and standalone features."
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />

          {/* Dynamic Review Detail Page by Slug */}
          <Route
            path="/reviews/:slug"
            element={
              <ReviewDetailPage
                allReviews={reviews}
                isBookmarked={false}
                onToggleBookmark={handleToggleBookmark}
                isLiked={false}
                onToggleLike={handleToggleLike}
              />
            }
          />

          {/* Taxonomy: Categories & Tags */}
          <Route
            path="/category/:slug"
            element={
              <ReviewsListPage
                reviews={reviews}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />
          <Route
            path="/tags/:slug"
            element={
              <ReviewsListPage
                reviews={reviews}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />

          {/* Search Route */}
          <Route
            path="/search"
            element={
              <ReviewsListPage
                reviews={reviews}
                pageTitle="Search Results"
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                likedIds={likedIds}
                onToggleLike={handleToggleLike}
              />
            }
          />

          {/* The Abstract Recommends Overview & Individual Lists */}
          <Route
            path="/recommends"
            element={
              <RecommendsPage
                recommendationLists={recommendationLists}
                onOpenAiConcierge={() => setIsAiConciergeOpen(true)}
              />
            }
          />
          <Route
            path="/recommends/:slug"
            element={
              <RecommendsPage
                recommendationLists={recommendationLists}
                onOpenAiConcierge={() => setIsAiConciergeOpen(true)}
              />
            }
          />

          {/* What to Watch Next */}
          <Route path="/what-to-watch-next" element={<WhatToWatchNextPage />} />

          {/* Static Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* 404 Not Found Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer
        onOpenAiConcierge={() => setIsAiConciergeOpen(true)}
      />

      {/* Global Modals & Drawers */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        reviews={reviews}
        recommendationLists={recommendationLists}
      />

      <AiConciergeModal
        isOpen={isAiConciergeOpen}
        onClose={() => setIsAiConciergeOpen(false)}
      />

      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarkedReviews={bookmarkedReviews}
        onRemoveBookmark={(id) => handleToggleBookmark(id)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
