import fs from "fs";
import path from "path";
import { NewsletterSubscriber } from "../../../src/types";
import { getSupabaseClient, isSupabaseConfigured } from "../supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

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

export const subscriberRepository = {
  getSubscribers(): NewsletterSubscriber[] {
    return readJsonFile<NewsletterSubscriber[]>(SUBSCRIBERS_FILE, []);
  },

  addSubscriber(
    email: string,
    preference: "all" | "movies" | "anime" | "weekly_take" = "all"
  ): { subscriber: NewsletterSubscriber; isNew: boolean } {
    const subscribers = readJsonFile<NewsletterSubscriber[]>(SUBSCRIBERS_FILE, []);
    const normalized = email.trim().toLowerCase();
    const existing = subscribers.find((s) => s.email.toLowerCase() === normalized);

    if (existing) {
      existing.status = "active";
      existing.preference = preference;
      writeJsonFile(SUBSCRIBERS_FILE, subscribers);

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        supabase?.from("newsletter_subscribers").upsert({
          id: existing.id,
          email: normalized,
          status: "active",
          preference,
        });
      }

      return { subscriber: existing, isNew: false };
    }

    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: normalized,
      subscribedAt: new Date().toISOString(),
      status: "active",
      preference,
    };
    subscribers.unshift(newSub);
    writeJsonFile(SUBSCRIBERS_FILE, subscribers);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("newsletter_subscribers").upsert({
        id: newSub.id,
        email: normalized,
        subscribed_at: newSub.subscribedAt,
        status: "active",
        preference,
      });
    }

    return { subscriber: newSub, isNew: true };
  },

  removeSubscriber(idOrEmail: string): boolean {
    const subscribers = readJsonFile<NewsletterSubscriber[]>(SUBSCRIBERS_FILE, []);
    const filtered = subscribers.filter(
      (s) => s.id !== idOrEmail && s.email.toLowerCase() !== idOrEmail.toLowerCase()
    );
    writeJsonFile(SUBSCRIBERS_FILE, filtered);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase
        ?.from("newsletter_subscribers")
        .delete()
        .or(`id.eq.${idOrEmail},email.eq.${idOrEmail.toLowerCase()}`);
    }

    return true;
  },
};
