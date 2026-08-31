import { reviewRepository } from './repositories/reviewRepository';
import { recommendationRepository } from './repositories/recommendationRepository';
import { whatNextRepository } from './repositories/whatNextRepository';
import { settingsRepository } from './repositories/settingsRepository';
import { commentRepository } from './repositories/commentRepository';
import { subscriberRepository } from './repositories/subscriberRepository';
import { tagRepository } from './repositories/tagRepository';
import { analyticsRepository } from './repositories/analyticsRepository';

export const db = {
  // Reviews
  getReviews: (includeDrafts = false) => reviewRepository.getAll(includeDrafts),
  getReviewsPaginated: (options = {}) => reviewRepository.getPaginated(options),
  getReviewById: (id: string) => reviewRepository.getById(id),
  getReviewBySlug: (slug: string) => reviewRepository.getBySlug(slug),
  getReviewsByType: (type: string, limit = 12, offset = 0) => reviewRepository.getByType(type, limit, offset),
  getReviewsByCategory: (category: string, limit = 12, offset = 0) => reviewRepository.getByCategory(category, limit, offset),
  getReviewsByTag: (tag: string, limit = 12, offset = 0) => reviewRepository.getByTag(tag, limit, offset),
  searchReviews: (query: string, filters = {}) => reviewRepository.search(query, filters),
  createReview: (review: any) => reviewRepository.createReview(review),
  updateReview: (review: any) => reviewRepository.updateReview(review),
  publishReview: (id: string) => reviewRepository.publishReview(id),
  unpublishReview: (id: string) => reviewRepository.unpublishReview(id),
  deleteReview: (id: string) => reviewRepository.deleteReview(id),
  duplicateReview: (id: string) => reviewRepository.duplicateReview(id),
  findReviewByAutomationKey: (key: any) => reviewRepository.findReviewByAutomationKey(key),

  // Recommendations
  getRecommendationLists: (includeDrafts = false) => recommendationRepository.getAll(includeDrafts),
  getRecommendationBySlug: (slug: string) => recommendationRepository.getBySlug(slug),
  saveRecommendationList: (list: any) => recommendationRepository.saveList(list),
  deleteRecommendationList: (id: string) => recommendationRepository.deleteList(id),

  // What to Watch Next
  getWhatToWatchNext: () => whatNextRepository.getAll(),
  saveWhatToWatchNext: (item: any) => whatNextRepository.saveItem(item),
  deleteWhatToWatchNext: (id: string) => whatNextRepository.deleteItem(id),

  // Comments
  getComments: (includeAll = false) => commentRepository.getAll(includeAll),
  addComment: (comment: any) => commentRepository.addComment(comment),
  updateCommentStatus: (id: string, status: any) => commentRepository.updateStatus(id, status),
  deleteComment: (id: string) => commentRepository.deleteComment(id),

  // Subscribers
  getSubscribers: () => subscriberRepository.getAll(),
  addSubscriber: (email: string, preference?: string) => subscriberRepository.addSubscriber(email, preference),
  removeSubscriber: (id: string) => subscriberRepository.removeSubscriber(id),

  // Tags
  getTags: () => tagRepository.getTags(),
  addTag: (tag: string) => tagRepository.addTag(tag),
  deleteTag: (tag: string) => tagRepository.deleteTag(tag),

  // Settings & Analytics
  getSettings: () => settingsRepository.getSettings(),
  updateSettings: (settings: any) => settingsRepository.updateSettings(settings),
  getAnalyticsSummary: () => analyticsRepository.getSummary(),
};

export {
  reviewRepository,
  recommendationRepository,
  whatNextRepository,
  settingsRepository,
  commentRepository,
  subscriberRepository,
  tagRepository,
  analyticsRepository,
};
