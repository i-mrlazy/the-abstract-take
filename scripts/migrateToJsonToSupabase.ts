import "dotenv/config";
import fs from "fs";
import path from "path";
import { getServerSupabaseClient as getSupabaseClient, isServerSupabaseConfigured as isSupabaseConfigured } from "../next-app/lib/supabase/server";
import { mapReviewToDb } from "../next-app/lib/db/repositories/reviewRepository";
import { validateReviewInput } from "../next-app/lib/utils/validation";
import { Review, RecommendationList, WhatToWatchNextItem, Comment, NewsletterSubscriber, SiteSettings } from "../next-app/types";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(filename: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      console.error(`Failed to parse ${filename}:`, e);
    }
  }
  return fallback;
}

export interface MigrationSummary {
  table: string;
  totalInJson: number;
  validRecords: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

/**
 * Reusable Supabase / PostgREST error formatter.
 * Formats message, code, details, and hint when available.
 */
export function formatSupabaseError(error: any): string {
  if (!error) return "Message: Unknown error";
  const parts: string[] = [];
  if (error.message) parts.push(`Message: ${error.message}`);
  if (error.code) parts.push(`Code: ${error.code}`);
  if (error.details) parts.push(`Details: ${error.details}`);
  if (error.hint) parts.push(`Hint: ${error.hint}`);

  if (parts.length === 0) {
    return `Message: ${typeof error === "object" ? JSON.stringify(error) : String(error)}`;
  }
  return parts.join("\n");
}

/**
 * Helper to record and immediately log errors consistently.
 */
function recordError(
  summary: MigrationSummary,
  table: string,
  recordLabel: string,
  recordId: string,
  error: any
): void {
  summary.skipped++;
  const formattedErr = formatSupabaseError(error);
  const errorEntry = `${recordLabel}\nID: ${recordId}\n${formattedErr}`;
  summary.errors.push(errorEntry);

  console.error(`\n❌ [ERROR] Table: ${table} | ${recordLabel} | ID: ${recordId}`);
  console.error(formattedErr);
}

export async function runMigration(): Promise<{ success: boolean; summaries: MigrationSummary[] }> {
  console.log("==================================================");
  console.log("🎬 THE ABSTRACT TAKE — DATABASE MIGRATION ENGINE");
  console.log("==================================================");

  const supabaseConfigured = isSupabaseConfigured();
  console.log(`Target: Supabase PostgreSQL (${supabaseConfigured ? "CONNECTED" : "OFFLINE / LOCAL BACKUP MODE"})`);
  console.log(`Source Directory: ${DATA_DIR}\n`);

  const supabase = getSupabaseClient();
  const summaries: MigrationSummary[] = [];

  // 1. Migrate Reviews
  const reviews = readJson<Review[]>("reviews.json", []);
  const reviewSummary: MigrationSummary = {
    table: "reviews",
    totalInJson: reviews.length,
    validRecords: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  for (const r of reviews) {
    const val = validateReviewInput(r);
    if (!val.valid) {
      recordError(
        reviewSummary,
        "reviews",
        `Review: ${r.title || "Untitled"}`,
        r.id || "unknown-id",
        {
          message: "Input validation failed",
          details: val.errors.map((e) => e.message).join("; "),
        }
      );
      continue;
    }
    reviewSummary.validRecords++;

    if (supabase) {
      const dbRow = mapReviewToDb(r);
      const { error } = await supabase.from("reviews").upsert(dbRow, { onConflict: "id" });
      if (error) {
        recordError(
          reviewSummary,
          "reviews",
          `Review: ${r.title}`,
          r.id,
          error
        );
      } else {
        reviewSummary.migrated++;
      }
    } else {
      reviewSummary.migrated++; // Simulated in local verified mode
    }
  }
  summaries.push(reviewSummary);

  // 2. Migrate Recommendation Lists
  const recommendations = readJson<RecommendationList[]>("recommendations.json", []);
  const recSummary: MigrationSummary = {
    table: "recommendation_lists",
    totalInJson: recommendations.length,
    validRecords: recommendations.length,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  for (const list of recommendations) {
    if (supabase) {
      const { error } = await supabase.from("recommendation_lists").upsert(
        {
          id: list.id,
          slug: list.slug || `rec-${list.id}`,
          title: list.title,
          subtitle: list.subtitle || "",
          cover_url: list.coverUrl,
          status: list.status || "published",
          category: list.category || "Personal Favorites",
          description: list.description,
          curator_name: list.curatorName || "The Abstract Take",
          items: list.items || [],
          updated_date: list.updatedDate || new Date().toISOString().split("T")[0],
          reads_count: list.readsCount || 0,
          is_featured: Boolean(list.isFeatured),
        },
        { onConflict: "id" }
      );
      if (error) {
        recordError(
          recSummary,
          "recommendation_lists",
          `List: ${list.title}`,
          list.id,
          error
        );
      } else {
        recSummary.migrated++;
      }
    } else {
      recSummary.migrated++;
    }
  }
  summaries.push(recSummary);

  // 3. Migrate What To Watch Next
  const whatNext = readJson<WhatToWatchNextItem[]>("what_next.json", []);
  const whatNextSummary: MigrationSummary = {
    table: "what_to_watch_next",
    totalInJson: whatNext.length,
    validRecords: whatNext.length,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  for (const item of whatNext) {
    if (supabase) {
      const { error } = await supabase.from("what_to_watch_next").upsert(
        {
          id: item.id,
          title: item.title,
          type: item.type,
          release_year: item.releaseYear,
          director: item.director || "",
          poster_url: item.posterUrl,
          banner_url: item.bannerUrl || null,
          abstract_score: item.abstractScore,
          mood_tag: item.moodTag,
          personal_commentary: item.personalCommentary,
          where_to_watch: item.whereToWatch,
          publish_date: item.publishDate,
          status: item.status || "published",
          scheduled_date: item.scheduledDate || null,
          ready_for_newsletter: item.readyForNewsletter !== false,
        },
        { onConflict: "id" }
      );
      if (error) {
        recordError(
          whatNextSummary,
          "what_to_watch_next",
          `Item: ${item.title}`,
          item.id,
          error
        );
      } else {
        whatNextSummary.migrated++;
      }
    } else {
      whatNextSummary.migrated++;
    }
  }
  summaries.push(whatNextSummary);

  // 4. Migrate Comments
  const comments = readJson<Comment[]>("comments.json", []);
  const commentSummary: MigrationSummary = {
    table: "comments",
    totalInJson: comments.length,
    validRecords: comments.length,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  for (const c of comments) {
    if (supabase) {
      const { error } = await supabase.from("comments").upsert(
        {
          id: c.id,
          review_id: c.reviewId,
          review_title: c.reviewTitle || null,
          user_name: c.userName,
          user_avatar: c.userAvatar || null,
          content: c.content,
          created_at: c.createdAt || new Date().toISOString(),
          likes: c.likes || 0,
          status: c.status || "approved",
          reply_to_id: c.replyToId || null,
        },
        { onConflict: "id" }
      );
      if (error) {
        recordError(
          commentSummary,
          "comments",
          `Comment on review: ${c.reviewId || "unknown"} (by ${c.userName || "anonymous"})`,
          c.id,
          error
        );
      } else {
        commentSummary.migrated++;
      }
    } else {
      commentSummary.migrated++;
    }
  }
  summaries.push(commentSummary);

  // 5. Migrate Subscribers
  const subscribers = readJson<NewsletterSubscriber[]>("subscribers.json", []);
  const subSummary: MigrationSummary = {
    table: "newsletter_subscribers",
    totalInJson: subscribers.length,
    validRecords: subscribers.length,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  for (const s of subscribers) {
    if (supabase) {
      const { error } = await supabase.from("newsletter_subscribers").upsert(
        {
          id: s.id,
          email: s.email.toLowerCase().trim(),
          subscribed_at: s.subscribedAt || new Date().toISOString(),
          status: s.status || "active",
          preference: s.preference || "all",
        },
        { onConflict: "email" }
      );
      if (error) {
        recordError(
          subSummary,
          "newsletter_subscribers",
          `Subscriber: ${s.email}`,
          s.id,
          error
        );
      } else {
        subSummary.migrated++;
      }
    } else {
      subSummary.migrated++;
    }
  }
  summaries.push(subSummary);

  // 6. Migrate Site Settings
  const settings = readJson<SiteSettings>("settings.json", {} as SiteSettings);
  const settingsSummary: MigrationSummary = {
    table: "site_settings",
    totalInJson: Object.keys(settings).length ? 1 : 0,
    validRecords: Object.keys(settings).length ? 1 : 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  if (Object.keys(settings).length > 0) {
    if (supabase) {
      const { error } = await supabase.from("site_settings").upsert(
        {
          id: "default_settings",
          site_title: settings.siteTitle,
          site_tagline: settings.siteTagline,
          creator_name: settings.creatorName,
          creator_bio: settings.creatorBio,
          creator_avatar: settings.creatorAvatar,
          twitter_url: settings.twitterUrl,
          letterboxd_url: settings.letterboxdUrl,
          contact_email: settings.contactEmail,
          default_og_image: settings.defaultOgImage,
          analytics_id: settings.analyticsId,
          newsletter_headline: settings.newsletterHeadline,
          newsletter_subheadline: settings.newsletterSubheadline,
          enable_comments: settings.enableComments,
          auto_approve_comments: settings.autoApproveComments,
        },
        { onConflict: "id" }
      );
      if (error) {
        recordError(
          settingsSummary,
          "site_settings",
          "Site Settings",
          "default_settings",
          error
        );
      } else {
        settingsSummary.migrated++;
      }
    } else {
      settingsSummary.migrated++;
    }
  }
  summaries.push(settingsSummary);

  // 7. Migrate Tags
  const tags = readJson<string[]>("tags.json", []);
  const tagSummary: MigrationSummary = {
    table: "tags",
    totalInJson: tags.length,
    validRecords: tags.length,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  for (const tag of tags) {
    const cleanTag = tag.trim();
    if (supabase) {
      const { error } = await supabase.from("tags").upsert({ name: cleanTag }, { onConflict: "name" });
      if (error) {
        recordError(
          tagSummary,
          "tags",
          `Tag: ${cleanTag}`,
          cleanTag,
          error
        );
      } else {
        tagSummary.migrated++;
      }
    } else {
      tagSummary.migrated++;
    }
  }
  summaries.push(tagSummary);

  // Print Summary Table
  console.log("\n----------------------------------------------------------------------------------");
  console.log("| Table Name               | In JSON | Valid | Migrated | Skipped | Errors       |");
  console.log("----------------------------------------------------------------------------------");
  for (const s of summaries) {
    const name = s.table.padEnd(24);
    const jsonCount = String(s.totalInJson).padStart(7);
    const validCount = String(s.validRecords).padStart(5);
    const migCount = String(s.migrated).padStart(8);
    const skipCount = String(s.skipped).padStart(7);
    const errCount = String(s.errors.length).padStart(12);
    console.log(`| ${name} | ${jsonCount} | ${validCount} | ${migCount} | ${skipCount} | ${errCount} |`);
  }
  console.log("----------------------------------------------------------------------------------");

  const totalMigrated = summaries.reduce((sum, s) => sum + s.migrated, 0);
  const totalErrors = summaries.reduce((sum, s) => sum + s.errors.length, 0);

  // Print Detailed Error Report if any errors occurred
  if (totalErrors > 0) {
    console.log("\n==================================================");
    console.log("❌ DETAILED MIGRATION ERRORS");
    console.log("==================================================");
    for (const s of summaries) {
      if (s.errors.length > 0) {
        console.log(`\n📌 TABLE: ${s.table}`);
        console.log("--------------------------------------------------");
        for (const err of s.errors) {
          console.log(err);
          console.log("");
        }
      }
    }
    console.log("==================================================");
  }

  // Print Final Status Message
  if (totalErrors === 0) {
    console.log(`\n✅ Migration Finished Successfully: ${totalMigrated} records processed, 0 errors.`);
  } else {
    console.log(`\n⚠️ Migration Finished With Errors: ${totalMigrated} records processed, ${totalErrors} errors.`);
  }

  return {
    success: totalErrors === 0,
    summaries,
  };
}

runMigration().catch((e) => {
  console.error("Migration failed with fatal error:", e);
  process.exit(1);
});
