import { Review, MediaType } from '../../../types';
import { getServerSupabaseClient, isServerSupabaseConfigured } from '../../supabase/server';
import { slugify } from '../../utils/slug';
import { normalizeScore } from '../../utils/rating';
import { readJsonFile, writeJsonFile } from '../fsUtils';

const REVIEWS_FILE = 'reviews.json';

export function mapDbToReview(row: any): Review {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    originalTitle: row.original_title || undefined,
    type: row.type,
    status: row.status || 'published',
    releaseYear: row.release_year,
    director: row.director || '',
    cast: Array.isArray(row.cast_list) ? row.cast_list : [],
    runtime: row.runtime || '2h 00m',
    genres: Array.isArray(row.genres) ? row.genres : [],
    posterUrl: row.poster_url,
    bannerUrl: row.banner_url,
    posterAlt: row.poster_alt || undefined,
    bannerAlt: row.banner_alt || undefined,
    abstractScore: normalizeScore(row.abstract_score),
    myTake: row.my_take,
    streamingPlatforms: Array.isArray(row.streaming_platforms) ? row.streaming_platforms : [],
    pros: Array.isArray(row.pros) ? row.pros : [],
    cons: Array.isArray(row.cons) ? row.cons : [],
    verdictText: row.verdict_text,
    shouldYouWatch: row.should_you_watch,
    longFormReview: row.long_form_review || '',
    spoilerFreeTake: row.spoiler_free_take || undefined,
    spoilerSection: row.spoiler_section || undefined,
    favoriteScene: row.favorite_scene || '',
    favoriteQuote: row.favorite_quote || '',
    publishDate: row.publish_date,
    scheduledDate: row.scheduled_date || undefined,
    updatedDate: row.updated_date || undefined,
    author: {
      name: row.author_name || 'The Abstract Take',
      title: row.author_title || 'Chief Cinema Critic',
      avatarUrl: row.author_avatar || '',
    },
    category: row.category,
    tags: Array.isArray(row.tags) ? row.tags : [],
    viewsCount: row.views_count || 0,
    likesCount: row.likes_count || 0,
    commentsCount: row.comments_count || 0,
    readingTimeMinutes: row.reading_time_minutes || 4,
    isFeatured: Boolean(row.is_featured),
    isLatestTake: Boolean(row.is_latest_take),
    isEditorPick: Boolean(row.is_editor_pick),
    isHiddenGem: Boolean(row.is_hidden_gem),
    synopsis: row.synopsis || undefined,
    trailerUrl: row.trailer_url || undefined,
    language: row.language || undefined,
    country: row.country || undefined,
    seo: row.seo_metadata || undefined,
    source: row.source || 'manual',
    automationRowId: row.automation_row_id || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  };
}

export function mapReviewToDb(r: Review): any {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    original_title: r.originalTitle || null,
    type: r.type,
    status: r.status || 'published',
    release_year: r.releaseYear,
    director: r.director || '',
    cast_list: r.cast || [],
    runtime: r.runtime || '2h 00m',
    genres: r.genres || [],
    poster_url: r.posterUrl,
    banner_url: r.bannerUrl,
    poster_alt: r.posterAlt || null,
    banner_alt: r.bannerAlt || null,
    abstract_score: normalizeScore(r.abstractScore),
    my_take: r.myTake,
    streaming_platforms: r.streamingPlatforms || [],
    pros: r.pros || [],
    cons: r.cons || [],
    verdict_text: r.verdictText,
    should_you_watch: r.shouldYouWatch || 'Must Watch',
    long_form_review: r.longFormReview,
    spoiler_free_take: r.spoilerFreeTake || null,
    spoiler_section: r.spoilerSection || null,
    favorite_scene: r.favoriteScene || '',
    favorite_quote: r.favoriteQuote || '',
    publish_date: r.publishDate || new Date().toISOString().split('T')[0],
    scheduled_date: r.scheduledDate || null,
    updated_date: r.updatedDate || new Date().toISOString().split('T')[0],
    author_name: r.author?.name || 'The Abstract Take',
    author_title: r.author?.title || 'Chief Cinema Critic',
    author_avatar: r.author?.avatarUrl || '',
    category: r.category || 'Movies',
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
    seo_metadata: r.seo || null,
    source: r.source || 'manual',
    automation_row_id: r.automationRowId || null,
    updated_at: new Date().toISOString(),
  };
}

export interface ReviewQueryOptions {
  includeDrafts?: boolean;
  type?: MediaType | string;
  category?: string;
  tag?: string;
  genre?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  limit?: number;
  offset?: number;
}

export class ReviewRepository {
  async getAll(includeDrafts = false): Promise<Review[]> {
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        let query = supabase.from('reviews').select('*').order('publish_date', { ascending: false });
        if (!includeDrafts) {
          query = query.eq('status', 'published');
        }
        const { data, error } = await query;
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getAll failed: ${error.message}`);
          }
          console.warn('[DEV NOTICE] Supabase query error, falling back to baseline:', error.message);
        } else if (data) {
          return data.map(mapDbToReview);
        }
      }
    }

    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    if (includeDrafts) return reviews;
    return reviews.filter((r) => r.status === 'published' || !r.status);
  }

  async getPaginated(options: ReviewQueryOptions = {}): Promise<{ reviews: Review[]; total: number; hasMore: boolean }> {
    const all = await this.getAll(options.includeDrafts);
    let filtered = all;

    if (options.type) {
      filtered = filtered.filter((r) => r.type.toLowerCase() === options.type!.toLowerCase());
    }

    if (options.category) {
      const cleanCat = options.category.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.category.toLowerCase() === cleanCat ||
          slugify(r.category) === cleanCat ||
          r.genres.some((g) => g.toLowerCase() === cleanCat || slugify(g) === cleanCat)
      );
    }

    if (options.tag) {
      const cleanTag = options.tag.toLowerCase().trim();
      filtered = filtered.filter((r) =>
        r.tags.some((t) => t.toLowerCase() === cleanTag || slugify(t) === cleanTag)
      );
    }

    if (options.genre) {
      const cleanGenre = options.genre.toLowerCase().trim();
      filtered = filtered.filter((r) =>
        r.genres.some((g) => g.toLowerCase() === cleanGenre || slugify(g) === cleanGenre)
      );
    }

    if (options.minScore) {
      filtered = filtered.filter((r) => r.abstractScore >= options.minScore!);
    }

    if (options.maxScore) {
      filtered = filtered.filter((r) => r.abstractScore <= options.maxScore!);
    }

    if (options.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.director.toLowerCase().includes(q) ||
          r.myTake.toLowerCase().includes(q) ||
          r.genres.some((g) => g.toLowerCase() === q || slugify(g) === q) ||
          r.cast.some((c) => c.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 12;
    const paginated = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      reviews: paginated,
      total,
      hasMore,
    };
  }

  async getById(id: string): Promise<Review | null> {
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('reviews').select('*').eq('id', id).maybeSingle();
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getById failed: ${error.message}`);
          }
        } else if (data) {
          return mapDbToReview(data);
        }
      }
    }
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    return reviews.find((r) => r.id === id || r.slug === id) || null;
  }

  async getBySlug(slug: string): Promise<Review | null> {
    const cleanSlug = slug.toLowerCase().trim();
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('reviews').select('*').eq('slug', cleanSlug).maybeSingle();
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getBySlug failed: ${error.message}`);
          }
        } else if (data) {
          return mapDbToReview(data);
        }
      }
    }
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    return reviews.find((r) => r.slug.toLowerCase() === cleanSlug) || null;
  }

  async findReviewByAutomationKey(key: { rowId?: string; slug?: string; title?: string; year?: number }): Promise<Review | undefined> {
    const reviews = await this.getAll(true);
    return reviews.find((r) => {
      if (key.rowId && r.automationRowId === key.rowId) return true;
      if (key.slug && (r.slug === key.slug || r.id === key.slug)) return true;
      if (key.title && r.title.toLowerCase().trim() === key.title.toLowerCase().trim() && (key.year ? r.releaseYear === key.year : true)) return true;
      return false;
    });
  }

  async createReview(review: Review): Promise<Review> {
    if (!review.id) {
      review.id = `review-${Date.now()}`;
    }
    if (!review.slug) {
      review.slug = slugify(review.title) + `-${review.releaseYear || new Date().getFullYear()}`;
    }
    review.abstractScore = normalizeScore(review.abstractScore);

    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const dbPayload = mapReviewToDb(review);
      const { data, error } = await supabase.from('reviews').upsert(dbPayload).select().single();
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase createReview failed: ${error.message}`);
      }
      return mapDbToReview(data || dbPayload);
    }

    // Development only: Local JSON fallback
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    const updated = [review, ...reviews.filter((r) => r.id !== review.id)];
    writeJsonFile(REVIEWS_FILE, updated);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase
        ?.from('reviews')
        .upsert(mapReviewToDb(review))
        .then(({ error }) => {
          if (error) console.error('Supabase dev review sync error:', error);
        });
    }

    return review;
  }

  async updateReview(review: Review): Promise<Review> {
    review.abstractScore = normalizeScore(review.abstractScore);
    review.updatedDate = new Date().toISOString().split('T')[0];

    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const dbPayload = mapReviewToDb(review);
      const { data, error } = await supabase.from('reviews').upsert(dbPayload).select().single();
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase updateReview failed: ${error.message}`);
      }
      return mapDbToReview(data || dbPayload);
    }

    // Development only: Local JSON fallback
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    const index = reviews.findIndex((r) => r.id === review.id);
    if (index === -1) {
      return this.createReview(review);
    }
    reviews[index] = review;
    writeJsonFile(REVIEWS_FILE, reviews);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase
        ?.from('reviews')
        .upsert(mapReviewToDb(review))
        .then(({ error }) => {
          if (error) console.error('Supabase dev review update error:', error);
        });
    }

    return review;
  }

  async deleteReview(id: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase deleteReview failed: ${error.message}`);
      }
      return true;
    }

    // Development only: Local JSON fallback
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    const filtered = reviews.filter((r) => r.id !== id);
    writeJsonFile(REVIEWS_FILE, filtered);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase
        ?.from('reviews')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase dev review delete error:', error);
        });
    }

    return true;
  }

  async duplicateReview(id: string): Promise<Review | null> {
    const original = await this.getById(id);
    if (!original) return null;
    const duplicated: Review = {
      ...original,
      id: `review-${Date.now()}`,
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: 'draft',
      publishDate: new Date().toISOString().split('T')[0],
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
    };

    return this.createReview(duplicated);
  }

  async getByType(type: MediaType | string, limit = 12, offset = 0) {
    return this.getPaginated({ type, limit, offset });
  }

  async getByCategory(category: string, limit = 12, offset = 0) {
    return this.getPaginated({ category, limit, offset });
  }

  async getByTag(tag: string, limit = 12, offset = 0) {
    return this.getPaginated({ tag, limit, offset });
  }

  async search(query: string, filters: Partial<ReviewQueryOptions> = {}) {
    return this.getPaginated({ ...filters, search: query });
  }
}

export const reviewRepository = new ReviewRepository();
