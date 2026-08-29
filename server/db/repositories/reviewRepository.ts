import fs from "fs";
import path from "path";
import { Review } from "../../../src/types";
import { getSupabaseClient, isSupabaseConfigured } from "../supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDir(DATA_DIR);
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
    throw err;
  }
}

export function mapDbToReview(row: any): Review {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    originalTitle: row.original_title || undefined,
    type: row.type,
    status: row.status,
    releaseYear: row.release_year,
    director: row.director || "",
    cast: Array.isArray(row.cast_list) ? row.cast_list : [],
    runtime: row.runtime || "2h 00m",
    genres: Array.isArray(row.genres) ? row.genres : [],
    posterUrl: row.poster_url,
    bannerUrl: row.banner_url,
    posterAlt: row.poster_alt || undefined,
    bannerAlt: row.banner_alt || undefined,
    abstractScore: row.abstract_score,
    myTake: row.my_take,
    streamingPlatforms: Array.isArray(row.streaming_platforms) ? row.streaming_platforms : [],
    pros: Array.isArray(row.pros) ? row.pros : [],
    cons: Array.isArray(row.cons) ? row.cons : [],
    verdictText: row.verdict_text,
    shouldYouWatch: row.should_you_watch,
    longFormReview: row.long_form_review,
    spoilerFreeTake: row.spoiler_free_take || undefined,
    spoilerSection: row.spoiler_section || undefined,
    favoriteScene: row.favorite_scene || "",
    favoriteQuote: row.favorite_quote || "",
    publishDate: row.publish_date,
    scheduledDate: row.scheduled_date || undefined,
    updatedDate: row.updated_date || undefined,
    author: {
      name: row.author_name || "The Abstract Take",
      title: row.author_title || "Editor-in-Chief & Film Critic",
      avatarUrl: row.author_avatar_url || "",
    },
    category: row.category || "Movies",
    tags: Array.isArray(row.tags) ? row.tags : [],
    viewsCount: row.views_count || 0,
    likesCount: row.likes_count || 0,
    commentsCount: row.comments_count || 0,
    readingTimeMinutes: row.reading_time_minutes || 3,
    isFeatured: Boolean(row.is_featured),
    isLatestTake: Boolean(row.is_latest_take),
    isEditorPick: Boolean(row.is_editor_pick),
    isHiddenGem: Boolean(row.is_hidden_gem),
    synopsis: row.synopsis || undefined,
    trailerUrl: row.trailer_url || undefined,
    language: row.language || undefined,
    country: row.country || undefined,
    seo: {
      metaTitle: row.seo_meta_title || `${row.title} Review — The Abstract Take`,
      metaDescription: row.seo_meta_description || row.my_take || "",
      keywords: Array.isArray(row.seo_keywords) ? row.seo_keywords : [row.title, "The Abstract Take"],
      slug: row.slug,
      ogImage: row.seo_og_image || row.banner_url || row.poster_url,
    },
    source: row.source || "manual",
    automationRowId: row.automation_row_id || undefined,
  };
}

export function mapReviewToDb(r: Review): any {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    original_title: r.originalTitle || null,
    type: r.type,
    status: r.status || "published",
    release_year: r.releaseYear,
    director: r.director || "",
    cast_list: r.cast || [],
    runtime: r.runtime || "2h 00m",
    genres: r.genres || [],
    poster_url: r.posterUrl,
    banner_url: r.bannerUrl,
    poster_alt: r.posterAlt || null,
    banner_alt: r.bannerAlt || null,
    abstract_score: r.abstractScore,
    my_take: r.myTake,
    streaming_platforms: r.streamingPlatforms || [],
    pros: r.pros || [],
    cons: r.cons || [],
    verdict_text: r.verdictText,
    should_you_watch: r.shouldYouWatch || "Must Watch",
    long_form_review: r.longFormReview,
    spoiler_free_take: r.spoilerFreeTake || null,
    spoiler_section: r.spoilerSection || null,
    favorite_scene: r.favoriteScene || "",
    favorite_quote: r.favoriteQuote || "",
    publish_date: r.publishDate || new Date().toISOString().split("T")[0],
    scheduled_date: r.scheduledDate || null,
    updated_date: r.updatedDate || new Date().toISOString().split("T")[0],
    author_name: r.author?.name || "The Abstract Take",
    author_title: r.author?.title || "Editor-in-Chief & Film Critic",
    author_avatar_url: r.author?.avatarUrl || "",
    category: r.category || "Movies",
    tags: r.tags || [],
    views_count: r.viewsCount || 0,
    likes_count: r.likesCount || 0,
    comments_count: r.commentsCount || 0,
    reading_time_minutes: r.readingTimeMinutes || 3,
    is_featured: Boolean(r.isFeatured),
    is_latest_take: Boolean(r.isLatestTake),
    is_editor_pick: Boolean(r.isEditorPick),
    is_hidden_gem: Boolean(r.isHiddenGem),
    synopsis: r.synopsis || null,
    trailer_url: r.trailerUrl || null,
    language: r.language || null,
    country: r.country || null,
    seo_meta_title: r.seo?.metaTitle || null,
    seo_meta_description: r.seo?.metaDescription || null,
    seo_keywords: r.seo?.keywords || [],
    seo_og_image: r.seo?.ogImage || null,
    source: r.source || "manual",
    automation_row_id: r.automationRowId || null,
    updated_at: new Date().toISOString(),
  };
}

export const reviewRepository = {
  getReviews(includeDrafts = false): Review[] {
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    if (includeDrafts) return reviews;
    return reviews.filter((r) => r.status === "published" || !r.status);
  },

  getReviewById(id: string): Review | undefined {
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    return reviews.find((r) => r.id === id || r.slug === id);
  },

  findReviewByAutomationKey(key: { rowId?: string; slug?: string; title?: string; year?: number }): Review | undefined {
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    return reviews.find((r) => {
      if (key.rowId && r.automationRowId === key.rowId) return true;
      if (key.slug && (r.slug === key.slug || r.id === key.slug)) return true;
      if (key.title && r.title.toLowerCase().trim() === key.title.toLowerCase().trim() && (key.year ? r.releaseYear === key.year : true)) return true;
      return false;
    });
  },

  createReview(review: Review): Review {
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    if (!review.id) {
      review.id = `review-${Date.now()}`;
    }
    if (!review.slug) {
      review.slug = review.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    const updated = [review, ...reviews.filter((r) => r.id !== review.id)];
    writeJsonFile(REVIEWS_FILE, updated);

    // Sync to Supabase if configured (async non-blocking)
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase
        ?.from("reviews")
        .upsert(mapReviewToDb(review))
        .then(({ error }) => {
          if (error) console.error("Supabase review sync error:", error);
        });
    }

    return review;
  },

  updateReview(review: Review): Review {
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    const index = reviews.findIndex((r) => r.id === review.id);
    if (index === -1) {
      return this.createReview(review);
    }
    review.updatedDate = new Date().toISOString().split("T")[0];
    reviews[index] = review;
    writeJsonFile(REVIEWS_FILE, reviews);

    // Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase
        ?.from("reviews")
        .upsert(mapReviewToDb(review))
        .then(({ error }) => {
          if (error) console.error("Supabase review update error:", error);
        });
    }

    return review;
  },

  deleteReview(id: string): boolean {
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    const filtered = reviews.filter((r) => r.id !== id);
    writeJsonFile(REVIEWS_FILE, filtered);

    // Sync deletion to Supabase
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase
        ?.from("reviews")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase review delete error:", error);
        });
    }

    return true;
  },

  duplicateReview(id: string): Review | null {
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    const original = reviews.find((r) => r.id === id);
    if (!original) return null;
    const duplicated: Review = {
      ...original,
      id: `review-${Date.now()}`,
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: "draft",
      publishDate: new Date().toISOString().split("T")[0],
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
    };
    reviews.unshift(duplicated);
    writeJsonFile(REVIEWS_FILE, reviews);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("reviews").upsert(mapReviewToDb(duplicated));
    }

    return duplicated;
  },
};
