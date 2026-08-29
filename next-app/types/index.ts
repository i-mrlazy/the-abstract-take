export type MediaType = 'Movie' | 'Series' | 'Anime' | 'Documentary' | 'Mini Series' | 'Special';

export type WatchVerdict = 'Must Watch' | 'Recommended' | 'For Fans' | 'Skip';

export type ReviewStatus = 'published' | 'draft' | 'scheduled' | 'archived';

export interface StreamingPlatform {
  name: string;
  type: 'Subscription' | 'Rent/Buy' | 'Free';
  url?: string;
  logoUrl?: string;
}

export interface ReviewSEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  slug?: string;
  canonicalUrl?: string;
  ogImage?: string;
  socialDescription?: string;
  noIndex?: boolean;
}

export interface Review {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  status?: ReviewStatus;
  releaseYear: number;
  director: string;
  cast: string[];
  runtime: string;
  genres: string[];
  posterUrl: string;
  bannerUrl: string;
  posterAlt?: string;
  bannerAlt?: string;
  abstractScore: number; // Strict 1 to 10
  myTake: string; // The creator's core editorial hook / personal thesis
  streamingPlatforms: StreamingPlatform[];
  pros: string[];
  cons: string[];
  verdictText: string;
  shouldYouWatch: WatchVerdict;
  longFormReview: string; // Rich editorial critique & analysis
  spoilerFreeTake?: string; // High-level spoiler-free thoughts
  spoilerSection?: string; // Deep spoiler analysis hidden behind reveal button
  favoriteScene: string;
  favoriteQuote: string;
  publishDate: string;
  scheduledDate?: string;
  updatedDate?: string;
  author: {
    name: string;
    title: string;
    avatarUrl: string;
  };
  category: string;
  tags: string[];
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  readingTimeMinutes: number;
  isFeatured?: boolean;
  isLatestTake?: boolean;
  isEditorPick?: boolean;
  isHiddenGem?: boolean;
  externalIds?: {
    tmdbId?: string;
    imdbId?: string;
  };
  synopsis?: string;
  trailerUrl?: string;
  language?: string;
  country?: string;
  seo?: ReviewSEO;
  source?: 'manual' | 'google_sheets_automation';
  automationRowId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecommendationListItem {
  id: string;
  title: string;
  type: MediaType;
  releaseYear?: number;
  year?: string | number;
  director: string;
  posterUrl: string;
  abstractScore: number;
  curatorNote: string;
  whereToWatch: string;
  reviewId?: string;
}

export interface RecommendationList {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  status: 'published' | 'draft';
  category: string;
  description: string;
  curatorName: string;
  items: RecommendationListItem[];
  updatedDate: string;
  readsCount?: number;
  isFeatured?: boolean;
}

export interface WhatToWatchNextItem {
  id: string;
  title: string;
  type: MediaType;
  releaseYear: number;
  director: string;
  posterUrl: string;
  bannerUrl?: string;
  abstractScore: number;
  moodTag: string;
  personalCommentary: string;
  whereToWatch: string;
  publishDate: string;
  status?: 'published' | 'draft' | 'scheduled';
  scheduledDate?: string;
  readyForNewsletter?: boolean;
}

export interface Comment {
  id: string;
  reviewId: string;
  reviewTitle?: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  status: 'approved' | 'pending' | 'hidden';
  replyToId?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
  preference?: 'all' | 'movies' | 'anime' | 'weekly_take' | string;
}

export interface AdPlacement {
  id: string;
  title: string;
  type: 'AdSense Banner' | 'Affiliate Box' | 'Streaming Promo' | 'Buy Me Coffee' | 'Editorial Promo' | 'Newsletter Box';
  slotPosition: 'Header' | 'Sidebar' | 'Mid-Article' | 'Footer' | 'Recommendation Hub';
  codeOrUrl?: string;
  isActive: boolean;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalReviews: number;
  totalRecommendations: number;
  avgAbstractScore: number;
  newsletterSubscribers: number;
  monthlyGrowthPercent: number;
}

export type UserRole = 'admin' | 'editor' | 'member';

export interface UserProfile {
  id: string;
  authUserId?: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  lastLogin?: string;
  profile?: UserProfile;
}

export interface SiteSettings {
  siteTitle: string;
  siteTagline: string;
  creatorName: string;
  creatorBio: string;
  creatorAvatar: string;
  twitterUrl: string;
  letterboxdUrl: string;
  contactEmail: string;
  defaultOgImage: string;
  analyticsId: string;
  newsletterHeadline: string;
  newsletterSubheadline: string;
  enableComments: boolean;
  autoApproveComments: boolean;
}

export interface MediaSearchResult {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  releaseYear: number;
  director: string;
  cast: string[];
  runtime: string;
  genres: string[];
  synopsis: string;
  posterUrl: string;
  bannerUrl: string;
  language?: string;
  country?: string;
  trailerUrl?: string;
  externalId?: string;
}

export interface EditorialDraftInput {
  title: string;
  year?: number | string;
  contentType?: string;
  rating: number;
  rawTake: string;
  likes?: string;
  dislikes?: string;
  personalVerdict?: string;
  verifiedFacts?: string;
  contextualBackground?: string;
}

export interface EditorialDraftResult {
  headline: string;
  editorialReview: string;
  longFormReview?: string;
  myTakeHook: string;
  thesis?: string;
  pros: string[];
  cons: string[];
  verdictText: string;
  shouldYouWatch: WatchVerdict;
  spoilerFreeTake?: string;
  abstractScore?: number;
}
