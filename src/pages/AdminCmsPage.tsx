import React, { useState, useEffect } from 'react';
import {
  Review,
  RecommendationList,
  WhatToWatchNextItem,
  Comment,
  NewsletterSubscriber,
  SiteSettings,
  ReviewStatus,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar';
import { DashboardOverview } from '../components/admin/DashboardOverview';
import { ReviewsTable } from '../components/admin/ReviewsTable';
import { ReviewEditor } from '../components/admin/ReviewEditor';
import { RecommendationsManager } from '../components/admin/RecommendationsManager';
import { WhatToWatchNextManager } from '../components/admin/WhatToWatchNextManager';
import { CommentsModerator } from '../components/admin/CommentsModerator';
import { NewsletterManager } from '../components/admin/NewsletterManager';
import { TagsManager } from '../components/admin/TagsManager';
import { MediaLibrary } from '../components/admin/MediaLibrary';
import { SettingsManager } from '../components/admin/SettingsManager';
import { Loader2 } from 'lucide-react';

interface AdminCmsPageProps {
  onClose: () => void;
  onRefreshPublicData?: () => Promise<void>;
}

export function AdminCmsPage({ onClose, onRefreshPublicData }: AdminCmsPageProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);

  // CMS Data States
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationList[]>([]);
  const [whatToWatchItems, setWhatToWatchItems] = useState<WhatToWatchNextItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Load all initial admin data
  const loadData = async () => {
    try {
      setLoading(true);
      const [
        revs,
        recs,
        nextItems,
        cmts,
        subs,
        tgs,
        stgs,
        anlytcs,
      ] = await Promise.all([
        api.getAdminReviews(),
        api.getRecommendations(),
        api.getWhatToWatchItems(),
        api.getAdminComments(),
        api.getNewsletterSubscribers(),
        api.getTags(),
        api.getSettings(),
        api.getAnalytics(),
      ]);

      setReviews(revs);
      setRecommendations(recs);
      setWhatToWatchItems(nextItems);
      setComments(cmts);
      setSubscribers(subs);
      setTags(tgs);
      setSettings(stgs);
      setAnalytics(anlytcs);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Review Operations
  const handleSaveReview = async (review: Review) => {
    const saved = await api.saveReview(review);
    setReviews((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setEditingReview(null);
    setActiveTab('reviews');
    if (onRefreshPublicData) onRefreshPublicData();
  };

  const handleDeleteReview = async (id: string) => {
    await api.deleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    if (onRefreshPublicData) onRefreshPublicData();
  };

  const handleDuplicateReview = async (id: string) => {
    const duplicated = await api.duplicateReview(id);
    setReviews((prev) => [duplicated, ...prev]);
    setEditingReview(duplicated);
    setActiveTab('new-review');
    if (onRefreshPublicData) onRefreshPublicData();
  };

  const handleToggleStatus = async (review: Review, newStatus: ReviewStatus) => {
    const updated = { ...review, status: newStatus };
    const saved = await api.saveReview(updated);
    setReviews((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
    if (onRefreshPublicData) onRefreshPublicData();
  };

  // Recommendation Lists Operations
  const handleSaveList = async (list: RecommendationList) => {
    const saved = await api.saveRecommendation(list);
    setRecommendations((prev) => {
      const idx = prev.findIndex((l) => l.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    if (onRefreshPublicData) onRefreshPublicData();
  };

  const handleDeleteList = async (id: string) => {
    await api.deleteRecommendation(id);
    setRecommendations((prev) => prev.filter((l) => l.id !== id));
    if (onRefreshPublicData) onRefreshPublicData();
  };

  // What to Watch Next Operations
  const handleSaveWhatToWatchItem = async (item: WhatToWatchNextItem) => {
    const saved = await api.saveWhatToWatchItem(item);
    setWhatToWatchItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    if (onRefreshPublicData) onRefreshPublicData();
  };

  const handleDeleteWhatToWatchItem = async (id: string) => {
    await api.deleteWhatToWatchItem(id);
    setWhatToWatchItems((prev) => prev.filter((i) => i.id !== id));
    if (onRefreshPublicData) onRefreshPublicData();
  };

  // Comments Operations
  const handleUpdateCommentStatus = async (id: string, status: 'approved' | 'pending' | 'hidden') => {
    await api.updateCommentStatus(id, status);
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const handleDeleteComment = async (id: string) => {
    await api.deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  // Subscribers Operations
  const handleAddSubscriber = async (email: string) => {
    await api.subscribeNewsletter(email);
    setSubscribers((prev) => [
      {
        id: `sub-${Date.now()}`,
        email,
        subscribedAt: new Date().toISOString(),
        status: 'active',
      },
      ...prev,
    ]);
  };

  const handleDeleteSubscriber = async (id: string) => {
    await api.deleteSubscriber(id);
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  };

  // Tags Operations
  const handleAddTag = async (tag: string) => {
    const updated = await api.addTag(tag);
    setTags(updated);
  };

  const handleDeleteTag = async (tag: string) => {
    const updated = await api.deleteTag(tag);
    setTags(updated);
  };

  // Settings Operations
  const handleSaveSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = await api.saveSettings(newSettings);
    setSettings(updated);
  };

  // Edit Review routing helper
  const handleStartEditReview = (review: Review) => {
    setEditingReview(review);
    setActiveTab('new-review');
  };

  const handleStartNewReview = () => {
    setEditingReview(null);
    setActiveTab('new-review');
  };

  // Media library image references
  const mediaLibraryImages = [
    ...reviews.map((r) => r.posterUrl),
    ...reviews.map((r) => r.bannerUrl).filter(Boolean),
    ...recommendations.map((l) => l.coverUrl).filter(Boolean),
  ].filter((url, idx, arr) => url && arr.indexOf(url) === idx) as string[];

  const pendingCommentsCount = comments.filter((c) => c.status === 'pending').length;
  const draftsCount = reviews.filter((r) => r.status === 'draft').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center text-gray-900 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#008CFF]" />
        <p className="font-mono text-sm uppercase tracking-widest text-gray-500">
          Loading Editorial Desk...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col md:flex-row text-left selection:bg-[#008CFF] selection:text-white">
      {/* Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'new-review') {
            setEditingReview(null);
          }
          setActiveTab(tab);
        }}
        pendingCommentsCount={pendingCommentsCount}
        draftsCount={draftsCount}
        onViewLiveSite={onClose}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-y-auto max-h-screen">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            reviews={reviews}
            recommendationLists={recommendations}
            comments={comments}
            analytics={analytics}
            onNavigate={(tab) => {
              if (tab === 'new-review') {
                setEditingReview(null);
              }
              setActiveTab(tab);
            }}
            onEditReview={handleStartEditReview}
            onApproveComment={(id) => handleUpdateCommentStatus(id, 'approved')}
            onViewLiveSite={onClose}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewsTable
            reviews={reviews}
            onEditReview={handleStartEditReview}
            onNewReview={handleStartNewReview}
            onDeleteReview={handleDeleteReview}
            onDuplicateReview={handleDuplicateReview}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {activeTab === 'new-review' && (
          <ReviewEditor
            initialReview={editingReview}
            onSave={handleSaveReview}
            onCancel={() => {
              setEditingReview(null);
              setActiveTab('reviews');
            }}
            availableTags={tags}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsManager
            lists={recommendations}
            onSaveList={handleSaveList}
            onDeleteList={handleDeleteList}
          />
        )}

        {activeTab === 'what-next' && (
          <WhatToWatchNextManager
            items={whatToWatchItems}
            onSaveItem={handleSaveWhatToWatchItem}
            onDeleteItem={handleDeleteWhatToWatchItem}
          />
        )}

        {activeTab === 'comments' && (
          <CommentsModerator
            comments={comments}
            onUpdateStatus={handleUpdateCommentStatus}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {activeTab === 'newsletter' && (
          <NewsletterManager
            subscribers={subscribers}
            onAddSubscriber={handleAddSubscriber}
            onDeleteSubscriber={handleDeleteSubscriber}
          />
        )}

        {activeTab === 'tags' && (
          <TagsManager
            tags={tags}
            onAddTag={handleAddTag}
            onDeleteTag={handleDeleteTag}
          />
        )}

        {activeTab === 'media' && (
          <MediaLibrary existingImages={mediaLibraryImages} />
        )}

        {activeTab === 'settings' && settings && (
          <SettingsManager
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>
    </div>
  );
}
