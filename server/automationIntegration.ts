import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { searchMediaMetadata } from "./media";
import { processEditorialDraft, getDerivedWatchVerdict } from "./editorialAssistant";
import { GoogleGenAI } from "@google/genai";
import { Review, MediaType, WatchVerdict, ReviewSEO } from "../src/types";

const DEFAULT_SECRET = "the_abstract_take_sheets_automation_secret_key_2026";

export function getAutomationSecret(): string {
  return (
    process.env.AUTOMATION_SECRET ||
    process.env.GOOGLE_SHEETS_AUTOMATION_SECRET ||
    DEFAULT_SECRET
  );
}

export function getBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL") {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.SITE_BASE_URL) {
    return process.env.SITE_BASE_URL.replace(/\/$/, "");
  }
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}

/**
 * Authentication Middleware for Google Apps Script requests
 */
export function validateAutomationSecret(req: Request, res: Response, next: NextFunction) {
  const expected = getAutomationSecret();
  const headerSecret = req.headers["x-automation-secret"] as string;
  const authHeader = req.headers["authorization"] as string;
  const querySecret = req.query.secret as string;

  let provided = headerSecret || querySecret;
  if (!provided && authHeader && authHeader.startsWith("Bearer ")) {
    provided = authHeader.slice(7).trim();
  }

  if (!provided || provided !== expected) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing automation secret key. Verify GOOGLE_SHEETS_AUTOMATION_SECRET.",
    });
  }

  next();
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseList(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  return String(input)
    .split(/[\n,;•]+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean);
}

function mapCategory(type: MediaType): string {
  switch (type) {
    case "Movie":
      return "Movies";
    case "Series":
    case "Mini Series":
      return "Series";
    case "Anime":
      return "Anime";
    case "Documentary":
      return "Documentaries";
    default:
      return "Critique";
  }
}

/**
 * Automation Integration Controller
 */
export const automationController = {
  // 1. Health & Connection Check
  checkHealth(req: Request, res: Response) {
    res.json({
      status: "ok",
      service: "The Abstract Take - Google Sheets Automation Engine",
      authenticated: true,
      timestamp: new Date().toISOString(),
      baseUrl: getBaseUrl(req),
    });
  },

  // 2. Google Sheet Template & Column Specs
  getTemplateSpec(req: Request, res: Response) {
    res.json({
      columns: [
        "TITLE",
        "RELEASE YEAR",
        "CONTENT TYPE",
        "EXTERNAL MEDIA ID",
        "RATING",
        "MY RAW TAKE",
        "THINGS I LIKED",
        "THINGS I DIDN'T LIKE",
        "PERSONAL VERDICT",
        "ADDITIONAL NOTES",
        "GENERATED HEADLINE",
        "GENERATED REVIEW",
        "GENERATED PROS",
        "GENERATED CONS",
        "GENERATED VERDICT",
        "GENERATED SEO DESCRIPTION",
        "GENERATED TAGS",
        "STATUS",
        "PUBLISHED URL",
        "LAST PROCESSED",
        "AUTOMATION NOTES",
      ],
      validStatuses: ["Pending", "Review generated", "Publish it", "Published"],
      minimumRequiredForGeneration: [
        "TITLE",
        "RELEASE YEAR",
        "CONTENT TYPE",
        "RATING",
        "MY RAW TAKE",
        "PERSONAL VERDICT",
      ],
    });
  },

  // 3. Generate Review (Called by Apps Script for 'Pending' rows)
  async generateReview(req: Request, res: Response, getGeminiClient: () => GoogleGenAI | null) {
    try {
      const {
        title,
        releaseYear,
        contentType,
        rating,
        rawTake,
        likes,
        dislikes,
        personalVerdict,
        additionalNotes,
        externalId,
        rowId,
      } = req.body;

      // Validation of minimum required fields
      if (!title || !rawTake || !personalVerdict) {
        return res.status(400).json({
          error: "MissingRequiredFields",
          message: "Title, My Raw Take, and Personal Verdict are required for editorial generation.",
        });
      }

      const normScore = Math.max(1, Math.min(10, Math.round(Number(rating) || 8)));
      const cleanType: MediaType = (contentType as MediaType) || "Movie";

      const draftResult = await processEditorialDraft(
        {
          title: String(title).trim(),
          year: releaseYear ? Number(releaseYear) : undefined,
          contentType: cleanType,
          rating: normScore,
          rawTake: String(rawTake).trim(),
          likes: likes ? String(likes) : undefined,
          dislikes: dislikes ? String(dislikes) : undefined,
          personalVerdict: String(personalVerdict).trim(),
          verifiedFacts: additionalNotes ? String(additionalNotes) : undefined,
          contextualBackground: externalId ? `External ID: ${externalId}` : undefined,
        },
        getGeminiClient
      );

      // Construct tags array
      const tags = [
        cleanType,
        `${cleanType} Review`,
        "The Abstract Take",
        normScore >= 9 ? "Masterpiece" : normScore >= 8 ? "Must Watch" : "Editorial Review",
      ];

      const seoDescription = draftResult.myTakeHook
        ? `The Abstract Take's review of ${title}: "${draftResult.myTakeHook.slice(0, 140)}..." Score: ${normScore}/10.`
        : `Editorial review and Abstract Score (${normScore}/10) for ${title} (${releaseYear || new Date().getFullYear()}).`;

      res.json({
        success: true,
        rowId,
        data: {
          title,
          releaseYear: releaseYear ? Number(releaseYear) : new Date().getFullYear(),
          contentType: cleanType,
          rating: normScore,
          headline: draftResult.headline,
          editorialReview: draftResult.editorialReview,
          pros: draftResult.pros.join("\n"),
          cons: draftResult.cons.join("\n"),
          verdict: draftResult.verdictText,
          seoDescription,
          tags: tags.join(", "),
          shouldYouWatch: draftResult.shouldYouWatch,
          myTakeHook: draftResult.myTakeHook,
        },
      });
    } catch (err: any) {
      console.error("Automation Generate Error:", err);
      res.status(500).json({
        error: "GenerationFailed",
        message: err.message || "Failed to generate editorial review.",
      });
    }
  },

  // 4. Publish Approved Review (Called by Apps Script for 'Publish it' rows)
  async publishReview(req: Request, res: Response) {
    try {
      const {
        rowId,
        title,
        releaseYear,
        contentType,
        externalId,
        rating,
        rawTake,
        likes,
        dislikes,
        personalVerdict,
        additionalNotes,
        headline,
        editorialReview,
        pros,
        cons,
        verdict,
        seoDescription,
        tags,
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: "MissingTitle", message: "Title is required for publishing." });
      }

      const cleanTitle = String(title).trim();
      const cleanYear = Number(releaseYear) || new Date().getFullYear();
      const cleanType: MediaType = (contentType as MediaType) || "Movie";
      const normScore = Math.max(1, Math.min(10, Math.round(Number(rating) || 8)));
      const baseSlug = `${slugify(cleanTitle)}-${cleanYear}`;

      // Idempotency: Check if this review already exists in the real database
      const existing = db.findReviewByAutomationKey({
        rowId: rowId ? String(rowId) : undefined,
        slug: baseSlug,
        title: cleanTitle,
        year: cleanYear,
      });

      // Enrich media metadata (posters, director, cast) from cinema engine if missing
      let director = "Editorial Curator";
      let cast: string[] = [];
      let runtime = cleanType === "Movie" ? "2h 00m" : "45m / ep";
      let genres = [cleanType, "Cinema"];
      let synopsis = additionalNotes || `Editorial feature critique of ${cleanTitle}.`;
      let posterUrl = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop";
      let bannerUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop";

      if (existing) {
        director = existing.director || director;
        cast = existing.cast || cast;
        runtime = existing.runtime || runtime;
        genres = existing.genres || genres;
        synopsis = existing.synopsis || synopsis;
        posterUrl = existing.posterUrl || posterUrl;
        bannerUrl = existing.bannerUrl || bannerUrl;
      } else {
        try {
          const mediaResults = await searchMediaMetadata(cleanTitle, cleanType);
          if (mediaResults.length > 0) {
            const match = mediaResults[0];
            if (match.director) director = match.director;
            if (match.cast?.length) cast = match.cast;
            if (match.runtime) runtime = match.runtime;
            if (match.genres?.length) genres = match.genres;
            if (match.synopsis) synopsis = match.synopsis;
            if (match.posterUrl) posterUrl = match.posterUrl;
            if (match.bannerUrl) bannerUrl = match.bannerUrl;
          }
        } catch (mediaErr) {
          console.warn("Media enrichment non-blocking warning:", mediaErr);
        }
      }

      // Parse pros, cons, tags
      const parsedPros = parseList(pros || likes);
      const parsedCons = parseList(cons || dislikes);
      const parsedTags = parseList(tags || [cleanType, "Auteur", "The Abstract Take"]);

      const longForm = editorialReview || rawTake || `${cleanTitle} is reviewed on The Abstract Take.`;
      const wordCount = longForm.trim().split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(2, Math.round(wordCount / 180));
      const watchVerdict = getDerivedWatchVerdict(normScore);

      const reviewId = existing ? existing.id : `review-${Date.now()}-${slugify(cleanTitle)}`;
      const finalSlug = existing ? existing.slug : baseSlug;

      const reviewSeo: ReviewSEO = {
        metaTitle: `${cleanTitle} (${cleanYear}) Review — The Abstract Take`,
        metaDescription:
          seoDescription ||
          (rawTake
            ? `"${String(rawTake).slice(0, 140)}..." Score: ${normScore}/10.`
            : `Personal review and Abstract Score (${normScore}/10) for ${cleanTitle}.`),
        keywords: [cleanTitle, `${cleanTitle} Review`, cleanType, "The Abstract Take", `Score ${normScore}`],
        slug: finalSlug,
        ogImage: bannerUrl || posterUrl,
      };

      const reviewToSave: Review = {
        id: reviewId,
        slug: finalSlug,
        title: cleanTitle,
        type: cleanType,
        status: "published",
        releaseYear: cleanYear,
        director,
        cast,
        runtime,
        genres,
        posterUrl,
        bannerUrl,
        abstractScore: normScore,
        myTake: headline || rawTake ? String(rawTake).slice(0, 180) : `${cleanTitle} earns a ${normScore}/10 on The Abstract Take.`,
        streamingPlatforms: existing?.streamingPlatforms || [
          { name: "Max / VOD", type: "Subscription" },
          { name: "Apple TV", type: "Rent/Buy" },
        ],
        pros: parsedPros.length ? parsedPros : ["Distinct stylistic voice", "Focused aesthetic direction"],
        cons: parsedCons,
        verdictText: verdict || personalVerdict || `${cleanTitle} earns an authoritative ${normScore}/10 on The Abstract Take.`,
        shouldYouWatch: watchVerdict,
        longFormReview: longForm,
        spoilerFreeTake: personalVerdict || undefined,
        favoriteScene: existing?.favoriteScene || "Opening sequence establishing tone and rhythm.",
        favoriteQuote: existing?.favoriteQuote || "",
        publishDate: existing?.publishDate || new Date().toISOString().split("T")[0],
        updatedDate: new Date().toISOString().split("T")[0],
        author: {
          name: "The Abstract Take",
          title: "Editor-in-Chief & Film Critic",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
        },
        category: mapCategory(cleanType),
        tags: parsedTags,
        viewsCount: existing?.viewsCount || 1,
        likesCount: existing?.likesCount || 0,
        commentsCount: existing?.commentsCount || 0,
        readingTimeMinutes: readTime,
        synopsis,
        seo: reviewSeo,
        source: "google_sheets_automation",
        automationRowId: rowId ? String(rowId) : undefined,
      };

      const savedReview = existing ? db.updateReview(reviewToSave) : db.createReview(reviewToSave);

      const baseUrl = getBaseUrl(req);
      const publishedUrl = `${baseUrl}/reviews/${savedReview.slug}`;

      res.json({
        success: true,
        isUpdate: Boolean(existing),
        reviewId: savedReview.id,
        slug: savedReview.slug,
        title: savedReview.title,
        publishedUrl,
        status: "Published",
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Automation Publish Error:", err);
      res.status(500).json({
        error: "PublishFailed",
        message: err.message || "Failed to publish review.",
      });
    }
  },

  // 5. Batch Publish
  async batchPublish(req: Request, res: Response) {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: "InvalidPayload", message: "Expected array of rows." });
      }

      const results = [];
      for (const row of rows) {
        try {
          // Re-use publishing logic per row
          const cleanTitle = String(row.title || "").trim();
          if (!cleanTitle) continue;
          const cleanYear = Number(row.releaseYear) || new Date().getFullYear();
          const baseSlug = `${slugify(cleanTitle)}-${cleanYear}`;

          const existing = db.findReviewByAutomationKey({
            rowId: row.rowId ? String(row.rowId) : undefined,
            slug: baseSlug,
            title: cleanTitle,
            year: cleanYear,
          });

          const normScore = Math.max(1, Math.min(10, Math.round(Number(row.rating) || 8)));
          const cleanType: MediaType = (row.contentType as MediaType) || "Movie";

          const reviewId = existing ? existing.id : `review-${Date.now()}-${slugify(cleanTitle)}`;
          const finalSlug = existing ? existing.slug : baseSlug;

          const reviewToSave: Review = {
            id: reviewId,
            slug: finalSlug,
            title: cleanTitle,
            type: cleanType,
            status: "published",
            releaseYear: cleanYear,
            director: existing?.director || "Editorial Curator",
            cast: existing?.cast || [],
            runtime: existing?.runtime || "2h 00m",
            genres: existing?.genres || [cleanType, "Cinema"],
            posterUrl: existing?.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
            bannerUrl: existing?.bannerUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
            abstractScore: normScore,
            myTake: row.headline || row.rawTake ? String(row.rawTake).slice(0, 180) : `${cleanTitle} review on The Abstract Take.`,
            streamingPlatforms: existing?.streamingPlatforms || [{ name: "Max", type: "Subscription" }],
            pros: parseList(row.pros || row.likes),
            cons: parseList(row.cons || row.dislikes),
            verdictText: row.verdict || row.personalVerdict || `${cleanTitle} earns a ${normScore}/10.`,
            shouldYouWatch: getDerivedWatchVerdict(normScore),
            longFormReview: row.editorialReview || row.rawTake || `${cleanTitle} review.`,
            favoriteScene: existing?.favoriteScene || "Opening sequence establishing tone.",
            favoriteQuote: existing?.favoriteQuote || "",
            publishDate: existing?.publishDate || new Date().toISOString().split("T")[0],
            updatedDate: new Date().toISOString().split("T")[0],
            author: {
              name: "The Abstract Take",
              title: "Editor-in-Chief & Film Critic",
              avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
            },
            category: mapCategory(cleanType),
            tags: parseList(row.tags || [cleanType, "The Abstract Take"]),
            viewsCount: existing?.viewsCount || 1,
            likesCount: existing?.likesCount || 0,
            commentsCount: existing?.commentsCount || 0,
            readingTimeMinutes: 2,
            seo: {
              metaTitle: `${cleanTitle} (${cleanYear}) Review — The Abstract Take`,
              metaDescription: `Editorial review for ${cleanTitle}. Score: ${normScore}/10.`,
              keywords: [cleanTitle, cleanType, "The Abstract Take"],
            },
            source: "google_sheets_automation",
            automationRowId: row.rowId ? String(row.rowId) : undefined,
          };

          const saved = existing ? db.updateReview(reviewToSave) : db.createReview(reviewToSave);
          const baseUrl = getBaseUrl(req);
          results.push({
            rowId: row.rowId,
            success: true,
            slug: saved.slug,
            publishedUrl: `${baseUrl}/reviews/${saved.slug}`,
          });
        } catch (rowErr: any) {
          results.push({
            rowId: row.rowId,
            success: false,
            error: rowErr.message,
          });
        }
      }

      res.json({ success: true, count: results.length, results });
    } catch (err: any) {
      console.error("Batch publish error:", err);
      res.status(500).json({ error: "BatchPublishFailed", message: err.message });
    }
  },
};
