import fs from "fs";
import path from "path";
import { Review, RecommendationList, WhatToWatchNextItem, Comment, NewsletterSubscriber, SiteSettings } from "../src/types";
import { INITIAL_REVIEWS, INITIAL_RECOMMENDATION_LISTS, INITIAL_COMMENTS } from "../src/data/mockData";
import { reviewRepository } from "./db/repositories/reviewRepository";
import { recommendationRepository } from "./db/repositories/recommendationRepository";
import { commentRepository } from "./db/repositories/commentRepository";
import { subscriberRepository } from "./db/repositories/subscriberRepository";
import { settingsRepository } from "./db/repositories/settingsRepository";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");
const RECOMMENDS_FILE = path.join(DATA_DIR, "recommendations.json");
const WHAT_NEXT_FILE = path.join(DATA_DIR, "what_next.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const TAGS_FILE = path.join(DATA_DIR, "tags.json");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDir(DATA_DIR);
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
  }
}

/**
 * Initialize and seed initial data files if not yet present
 */
export function initDatabase() {
  ensureDir(DATA_DIR);
  ensureDir(UPLOADS_DIR);

  // Initialize Reviews
  if (!fs.existsSync(REVIEWS_FILE)) {
    writeJsonFile(REVIEWS_FILE, INITIAL_REVIEWS);
  }

  // Initialize Recommendations
  if (!fs.existsSync(RECOMMENDS_FILE)) {
    writeJsonFile(RECOMMENDS_FILE, INITIAL_RECOMMENDATION_LISTS);
  }

  // Initialize Comments
  if (!fs.existsSync(COMMENTS_FILE)) {
    writeJsonFile(COMMENTS_FILE, INITIAL_COMMENTS);
  }

  // Initialize Settings
  if (!fs.existsSync(SETTINGS_FILE)) {
    writeJsonFile(SETTINGS_FILE, settingsRepository.getSettings());
  }

  // Initialize Tags
  if (!fs.existsSync(TAGS_FILE)) {
    writeJsonFile(TAGS_FILE, settingsRepository.getTags());
  }
}

/**
 * Unified Database Access Facade
 */
export const db = {
  // Reviews
  getReviews(includeDrafts = false): Review[] {
    return reviewRepository.getReviews(includeDrafts);
  },

  getReviewById(id: string): Review | undefined {
    return reviewRepository.getReviewById(id);
  },

  findReviewByAutomationKey(key: { rowId?: string; slug?: string; title?: string; year?: number }): Review | undefined {
    return reviewRepository.findReviewByAutomationKey(key);
  },

  createReview(review: Review): Review {
    return reviewRepository.createReview(review);
  },

  updateReview(review: Review): Review {
    return reviewRepository.updateReview(review);
  },

  deleteReview(id: string): boolean {
    return reviewRepository.deleteReview(id);
  },

  duplicateReview(id: string): Review | null {
    return reviewRepository.duplicateReview(id);
  },

  // Recommendation Lists
  getRecommendationLists(): RecommendationList[] {
    return recommendationRepository.getRecommendationLists();
  },

  saveRecommendationList(list: RecommendationList): RecommendationList {
    return recommendationRepository.saveRecommendationList(list);
  },

  deleteRecommendationList(id: string): boolean {
    return recommendationRepository.deleteRecommendationList(id);
  },

  // What To Watch Next
  getWhatToWatchNext(): WhatToWatchNextItem[] {
    return recommendationRepository.getWhatToWatchNext();
  },

  saveWhatToWatchNext(item: WhatToWatchNextItem): WhatToWatchNextItem {
    return recommendationRepository.saveWhatToWatchNext(item);
  },

  deleteWhatToWatchNext(id: string): boolean {
    return recommendationRepository.deleteWhatToWatchNext(id);
  },

  // Comments
  getComments(): Comment[] {
    return commentRepository.getComments();
  },

  addComment(comment: Comment): Comment {
    return commentRepository.addComment(comment);
  },

  updateCommentStatus(id: string, status: "approved" | "pending" | "hidden"): boolean {
    return commentRepository.updateCommentStatus(id, status);
  },

  deleteComment(id: string): boolean {
    return commentRepository.deleteComment(id);
  },

  // Newsletter Subscribers
  getSubscribers(): NewsletterSubscriber[] {
    return subscriberRepository.getSubscribers();
  },

  addSubscriber(
    email: string,
    preference: "all" | "movies" | "anime" | "weekly_take" = "all"
  ): { subscriber: NewsletterSubscriber; isNew: boolean } {
    return subscriberRepository.addSubscriber(email, preference);
  },

  removeSubscriber(idOrEmail: string): boolean {
    return subscriberRepository.removeSubscriber(idOrEmail);
  },

  // Settings & Tags
  getSettings(): SiteSettings {
    return settingsRepository.getSettings();
  },

  updateSettings(settings: Partial<SiteSettings>): SiteSettings {
    return settingsRepository.updateSettings(settings);
  },

  getTags(): string[] {
    return settingsRepository.getTags();
  },

  addTag(tag: string): string[] {
    return settingsRepository.addTag(tag);
  },

  deleteTag(tag: string): string[] {
    return settingsRepository.deleteTag(tag);
  },

  // Analytics
  getAnalyticsSummary() {
    return settingsRepository.getAnalyticsSummary();
  },
};
