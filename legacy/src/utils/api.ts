import { Review, RecommendationList, WhatToWatchNextItem, Comment, NewsletterSubscriber, SiteSettings, MediaSearchResult, AnalyticsSummary, EditorialDraftInput, EditorialDraftResult } from '../types';

const TOKEN_KEY = 'abstract_admin_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null, keepSignedIn = true): void {
  try {
    if (token) {
      if (keepSignedIn) {
        localStorage.setItem(TOKEN_KEY, token);
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem(TOKEN_KEY);
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error(e);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(emailOrUsername: string, password: string, keepSignedIn = false) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password, keepSignedIn }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Invalid email or password.');
    }
    setStoredToken(data.token, keepSignedIn);
    return data;
  },

  async verifySession() {
    const token = getStoredToken();
    if (!token) return { authenticated: false };
    const res = await fetch('/api/auth/session', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      setStoredToken(null);
      return { authenticated: false };
    }
    return await res.json();
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      setStoredToken(null);
    }
  },

  // Reviews
  async getReviews(includeDrafts = false): Promise<Review[]> {
    const url = includeDrafts ? '/api/reviews?status=all' : '/api/reviews';
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.reviews || [];
  },

  async getAdminReviews(): Promise<Review[]> {
    return this.getReviews(true);
  },

  async getReview(id: string): Promise<Review> {
    const res = await fetch(`/api/reviews/${id}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Review not found');
    return data.review;
  },

  async saveReview(review: Review): Promise<Review> {
    // If review already has an ID that matches existing, we PUT or POST
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(review),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save review');
    return data.review;
  },

  async createReview(review: Review): Promise<Review> {
    return this.saveReview(review);
  },

  async updateReview(review: Review): Promise<Review> {
    const res = await fetch(`/api/reviews/${review.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(review),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update review');
    return data.review;
  },

  async deleteReview(id: string): Promise<boolean> {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete review');
    return true;
  },

  async duplicateReview(id: string): Promise<Review> {
    const res = await fetch(`/api/reviews/${id}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to duplicate review');
    return data.review;
  },

  // Media Search
  async searchMedia(query: string, type?: string): Promise<MediaSearchResult[]> {
    const params = new URLSearchParams({ q: query });
    if (type) params.append('type', type);
    const res = await fetch(`/api/media/search?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Media search failed');
    return data.results || [];
  },

  // Recommendations
  async getRecommendations(): Promise<RecommendationList[]> {
    const res = await fetch('/api/recommendations');
    const data = await res.json();
    return data.lists || [];
  },

  async saveRecommendation(list: RecommendationList): Promise<RecommendationList> {
    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(list),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save recommendation list');
    return data.list;
  },

  async deleteRecommendation(id: string): Promise<boolean> {
    const res = await fetch(`/api/recommendations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete recommendation list');
    return true;
  },

  // What To Watch Next
  async getWhatToWatchNext(): Promise<WhatToWatchNextItem[]> {
    const res = await fetch('/api/what-to-watch-next');
    const data = await res.json();
    return data.items || [];
  },

  async getWhatToWatchItems(): Promise<WhatToWatchNextItem[]> {
    return this.getWhatToWatchNext();
  },

  async saveWhatToWatchNext(item: WhatToWatchNextItem): Promise<WhatToWatchNextItem> {
    const res = await fetch('/api/what-to-watch-next', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save what to watch item');
    return data.item;
  },

  async saveWhatToWatchItem(item: WhatToWatchNextItem): Promise<WhatToWatchNextItem> {
    return this.saveWhatToWatchNext(item);
  },

  async deleteWhatToWatchNext(id: string): Promise<boolean> {
    const res = await fetch(`/api/what-to-watch-next/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete what to watch item');
    return true;
  },

  async deleteWhatToWatchItem(id: string): Promise<boolean> {
    return this.deleteWhatToWatchNext(id);
  },

  // Comments
  async getComments(): Promise<Comment[]> {
    const res = await fetch('/api/comments', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.comments || [];
  },

  async getAdminComments(): Promise<Comment[]> {
    return this.getComments();
  },

  async addComment(reviewId: string, userName: string, content: string): Promise<Comment> {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, userName, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to post comment');
    return data.comment;
  },

  async updateCommentStatus(id: string, status: 'approved' | 'pending' | 'hidden'): Promise<Comment> {
    const res = await fetch(`/api/comments/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update comment status');
    return data.comment;
  },

  async deleteComment(id: string): Promise<boolean> {
    const res = await fetch(`/api/comments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete comment');
    return true;
  },

  // Newsletter
  async subscribeNewsletter(email: string, preference?: string) {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, preference }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Subscription failed');
    return data;
  },

  async getSubscribers(): Promise<NewsletterSubscriber[]> {
    const res = await fetch('/api/newsletter/subscribers', {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.subscribers || [];
  },

  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return this.getSubscribers();
  },

  async deleteSubscriber(id: string): Promise<boolean> {
    const res = await fetch(`/api/newsletter/subscribers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete subscriber');
    return true;
  },

  // Settings & Tags
  async getSettings(): Promise<SiteSettings> {
    const res = await fetch('/api/settings');
    const data = await res.json();
    return data.settings;
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update settings');
    return data.settings;
  },

  async saveSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.updateSettings(settings);
  },

  async getTags(): Promise<string[]> {
    const res = await fetch('/api/tags');
    const data = await res.json();
    return data.tags || [];
  },

  async addTag(tag: string): Promise<string[]> {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tag }),
    });
    const data = await res.json();
    return data.tags || [];
  },

  async deleteTag(tag: string): Promise<string[]> {
    const res = await fetch(`/api/tags/${encodeURIComponent(tag)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.tags || [];
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    const res = await fetch('/api/analytics', { headers: getAuthHeaders() });
    const data = await res.json();
    return data.analytics;
  },

  // AI Editorial Assistant
  async generateEditorialDraft(input: EditorialDraftInput): Promise<EditorialDraftResult> {
    const res = await fetch('/api/ai/editorial-assistant', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to generate editorial review');
    }
    return data;
  },

  // Upload
  async uploadImage(dataUrl: string, filename?: string): Promise<{ url: string; filename: string }> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dataUrl, filename }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Image upload failed');
    return data;
  },
};
