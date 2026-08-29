import fs from "fs";
import path from "path";
import { RecommendationList, WhatToWatchNextItem } from "../../../src/types";
import { getSupabaseClient, isSupabaseConfigured } from "../supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const RECOMMENDS_FILE = path.join(DATA_DIR, "recommendations.json");
const WHAT_NEXT_FILE = path.join(DATA_DIR, "what_next.json");

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

export const recommendationRepository = {
  // Recommendation Lists
  getRecommendationLists(): RecommendationList[] {
    return readJsonFile<RecommendationList[]>(RECOMMENDS_FILE, []);
  },

  saveRecommendationList(list: RecommendationList): RecommendationList {
    const lists = readJsonFile<RecommendationList[]>(RECOMMENDS_FILE, []);
    if (!list.id) {
      list.id = `rec-${Date.now()}`;
    }
    const index = lists.findIndex((l) => l.id === list.id);
    if (index >= 0) {
      lists[index] = list;
    } else {
      lists.unshift(list);
    }
    writeJsonFile(RECOMMENDS_FILE, lists);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("recommendation_lists").upsert({
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
      });
    }

    return list;
  },

  deleteRecommendationList(id: string): boolean {
    const lists = readJsonFile<RecommendationList[]>(RECOMMENDS_FILE, []);
    writeJsonFile(RECOMMENDS_FILE, lists.filter((l) => l.id !== id));

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("recommendation_lists").delete().eq("id", id);
    }

    return true;
  },

  // What To Watch Next
  getWhatToWatchNext(): WhatToWatchNextItem[] {
    return readJsonFile<WhatToWatchNextItem[]>(WHAT_NEXT_FILE, []);
  },

  saveWhatToWatchNext(item: WhatToWatchNextItem): WhatToWatchNextItem {
    const items = readJsonFile<WhatToWatchNextItem[]>(WHAT_NEXT_FILE, []);
    if (!item.id) {
      item.id = `next-${Date.now()}`;
    }
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.unshift(item);
    }
    writeJsonFile(WHAT_NEXT_FILE, items);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("what_to_watch_next").upsert({
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
      });
    }

    return item;
  },

  deleteWhatToWatchNext(id: string): boolean {
    const items = readJsonFile<WhatToWatchNextItem[]>(WHAT_NEXT_FILE, []);
    writeJsonFile(WHAT_NEXT_FILE, items.filter((i) => i.id !== id));

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("what_to_watch_next").delete().eq("id", id);
    }

    return true;
  },
};
