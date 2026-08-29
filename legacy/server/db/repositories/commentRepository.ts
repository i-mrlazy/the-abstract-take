import fs from "fs";
import path from "path";
import { Comment } from "../../../src/types";
import { getSupabaseClient, isSupabaseConfigured } from "../supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");

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

export const commentRepository = {
  getComments(): Comment[] {
    return readJsonFile<Comment[]>(COMMENTS_FILE, []);
  },

  addComment(comment: Comment): Comment {
    const comments = readJsonFile<Comment[]>(COMMENTS_FILE, []);
    if (!comment.id) {
      comment.id = `comment-${Date.now()}`;
    }
    comment.createdAt = comment.createdAt || new Date().toISOString();
    comments.unshift(comment);
    writeJsonFile(COMMENTS_FILE, comments);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("comments").insert({
        id: comment.id,
        review_id: comment.reviewId,
        review_title: comment.reviewTitle || null,
        user_name: comment.userName,
        user_avatar: comment.userAvatar || null,
        content: comment.content,
        created_at: comment.createdAt,
        likes: comment.likes || 0,
        status: comment.status || "approved",
        reply_to_id: comment.replyToId || null,
      });
    }

    return comment;
  },

  updateCommentStatus(id: string, status: "approved" | "pending" | "hidden"): boolean {
    const comments = readJsonFile<Comment[]>(COMMENTS_FILE, []);
    const comment = comments.find((c) => c.id === id);
    if (comment) {
      comment.status = status;
      writeJsonFile(COMMENTS_FILE, comments);

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        supabase?.from("comments").update({ status }).eq("id", id);
      }
      return true;
    }
    return false;
  },

  deleteComment(id: string): boolean {
    const comments = readJsonFile<Comment[]>(COMMENTS_FILE, []);
    writeJsonFile(COMMENTS_FILE, comments.filter((c) => c.id !== id));

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.from("comments").delete().eq("id", id);
    }
    return true;
  },
};
