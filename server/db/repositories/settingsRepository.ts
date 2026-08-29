import fs from "fs";
import path from "path";
import { SiteSettings, Review, RecommendationList, Comment, NewsletterSubscriber } from "../../../src/types";
import { INITIAL_ANALYTICS } from "../../../src/data/mockData";
import { getSupabaseClient, isSupabaseConfigured } from "../supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const TAGS_FILE = path.join(DATA_DIR, "tags.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");
const RECOMMENDS_FILE = path.join(DATA_DIR, "recommendations.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "The Abstract Take",
  siteTagline: "Independent Film, Television & Anime Critique",
  creatorName: "The Abstract Take",
  creatorBio: "Personal editorial review publication and cinema companion—an unfiltered home for thoughtful critique, 1–10 Abstract Scores, and curated watchlists.",
  creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  twitterUrl: "https://twitter.com/TheAbstractTake",
  letterboxdUrl: "https://letterboxd.com/TheAbstractTake",
  contactEmail: "editor@theabstracttake.com",
  defaultOgImage: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop",
  analyticsId: "G-TAT-EDITORIAL",
  newsletterHeadline: "The Abstract Dispatch",
  newsletterSubheadline: "Weekly essays, spoiler-free verdicts, and handpicked cinema watchlists delivered every Friday.",
  enableComments: true,
  autoApproveComments: false,
};

const DEFAULT_TAGS = [
  "Auteur",
  "Masterpiece",
  "Hidden Gem",
  "Must Watch",
  "Personal Favorites",
  "Sci-Fi",
  "Denis Villeneuve",
  "IMAX",
  "Japanese Cinema",
  "A24",
  "Murakami",
  "Drama",
  "Apple TV+",
  "Corporate Dystopia",
  "Thriller",
  "Anime",
  "Studio Ghibli",
  "Hayao Miyazaki",
  "Crime",
  "HBO",
  "Crime Saga",
  "Colin Farrell",
  "Cyberpunk",
  "Sci-Fi Classic",
  "Top 10",
  "Rewatch Worthy",
  "Best of Year",
];

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

export const settingsRepository = {
  getSettings(): SiteSettings {
    return readJsonFile<SiteSettings>(SETTINGS_FILE, DEFAULT_SETTINGS);
  },

  updateSettings(settings: Partial<SiteSettings>): SiteSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    writeJsonFile(SETTINGS_FILE, updated);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("site_settings").upsert({
        id: "default_settings",
        site_title: updated.siteTitle,
        site_tagline: updated.siteTagline,
        creator_name: updated.creatorName,
        creator_bio: updated.creatorBio,
        creator_avatar: updated.creatorAvatar,
        twitter_url: updated.twitterUrl,
        letterboxd_url: updated.letterboxdUrl,
        contact_email: updated.contactEmail,
        default_og_image: updated.defaultOgImage,
        analytics_id: updated.analyticsId,
        newsletter_headline: updated.newsletterHeadline,
        newsletter_subheadline: updated.newsletterSubheadline,
        enable_comments: updated.enableComments,
        auto_approve_comments: updated.autoApproveComments,
        updated_at: new Date().toISOString(),
      });
    }

    return updated;
  },

  getTags(): string[] {
    return readJsonFile<string[]>(TAGS_FILE, DEFAULT_TAGS);
  },

  addTag(tag: string): string[] {
    const tags = this.getTags();
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      tags.push(trimmed);
      writeJsonFile(TAGS_FILE, tags);

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        supabase?.from("tags").upsert({ name: trimmed });
      }
    }
    return tags;
  },

  deleteTag(tag: string): string[] {
    const tags = this.getTags();
    const filtered = tags.filter((t) => t !== tag);
    writeJsonFile(TAGS_FILE, filtered);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("tags").delete().eq("name", tag);
    }
    return filtered;
  },

  getAnalyticsSummary() {
    const reviews = readJsonFile<Review[]>(REVIEWS_FILE, []);
    const recommendations = readJsonFile<RecommendationList[]>(RECOMMENDS_FILE, []);
    const comments = readJsonFile<Comment[]>(COMMENTS_FILE, []);
    const subscribers = readJsonFile<NewsletterSubscriber[]>(SUBSCRIBERS_FILE, []);

    const published = reviews.filter((r) => r.status === "published" || !r.status);
    const drafts = reviews.filter((r) => r.status === "draft");
    const scheduled = reviews.filter((r) => r.status === "scheduled");

    const totalViews = reviews.reduce((sum, r) => sum + (r.viewsCount || 0), 0) || INITIAL_ANALYTICS.totalViews;
    const scores = published.map((r) => r.abstractScore).filter((s) => typeof s === "number" && !isNaN(s));
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 92;

    return {
      totalViews,
      totalReviews: reviews.length,
      publishedReviews: published.length,
      draftReviews: drafts.length,
      scheduledReviews: scheduled.length,
      moviesCount: reviews.filter((r) => r.type === "Movie").length,
      seriesCount: reviews.filter((r) => r.type === "Series" || r.type === "Mini Series").length,
      animeCount: reviews.filter((r) => r.type === "Anime").length,
      documentaryCount: reviews.filter((r) => r.type === "Documentary").length,
      totalRecommendations: recommendations.length,
      avgAbstractScore: avgScore,
      newsletterSubscribers: subscribers.filter((s) => s.status === "active").length,
      pendingCommentsCount: comments.filter((c) => c.status === "pending").length,
      monthlyGrowthPercent: 24.6,
    };
  },
};
