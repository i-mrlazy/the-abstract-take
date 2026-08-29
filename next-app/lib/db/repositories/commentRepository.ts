import { Comment } from '../../../types';
import { getServerSupabaseClient, isServerSupabaseConfigured } from '../../supabase/server';
import { readJsonFile, writeJsonFile } from '../fsUtils';

const COMMENTS_FILE = 'comments.json';

export class CommentRepository {
  async getAll(includeAll = false): Promise<Comment[]> {
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        let query = supabase.from('comments').select('*').order('created_at', { ascending: false });
        if (!includeAll) {
          query = query.eq('status', 'approved');
        }
        const { data, error } = await query;
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getAll comments failed: ${error.message}`);
          }
        } else if (data) {
          return data.map((row: any) => ({
            id: row.id,
            reviewId: row.review_id,
            reviewTitle: row.review_title || undefined,
            userName: row.user_name,
            userAvatar: row.user_avatar || undefined,
            content: row.content,
            createdAt: row.created_at,
            likes: row.likes || 0,
            status: row.status || 'approved',
            replyToId: row.reply_to_id || undefined,
          }));
        }
      }
    }

    const comments = readJsonFile<Comment[]>(COMMENTS_FILE, []);
    if (includeAll) return comments;
    return comments.filter((c) => c.status === 'approved' || !c.status);
  }

  async addComment(comment: Comment): Promise<Comment> {
    if (!comment.id) {
      comment.id = `comment-${Date.now()}`;
    }
    comment.createdAt = comment.createdAt || new Date().toISOString();
    comment.status = comment.status || 'pending';

    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('comments').insert({
        id: comment.id,
        review_id: comment.reviewId,
        review_title: comment.reviewTitle || null,
        user_name: comment.userName,
        user_avatar: comment.userAvatar || null,
        content: comment.content,
        created_at: comment.createdAt,
        likes: comment.likes || 0,
        status: comment.status,
        reply_to_id: comment.replyToId || null,
      });
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase addComment failed: ${error.message}`);
      }
      return comment;
    }

    // Development only: Local JSON fallback
    const comments = readJsonFile<Comment[]>(COMMENTS_FILE, []);
    comments.unshift(comment);
    writeJsonFile(COMMENTS_FILE, comments);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase
        ?.from('comments')
        .insert({
          id: comment.id,
          review_id: comment.reviewId,
          review_title: comment.reviewTitle || null,
          user_name: comment.userName,
          user_avatar: comment.userAvatar || null,
          content: comment.content,
          created_at: comment.createdAt,
          likes: comment.likes || 0,
          status: comment.status,
          reply_to_id: comment.replyToId || null,
        })
        .then(() => {}, () => {});
    }

    return comment;
  }

  async updateStatus(id: string, status: 'approved' | 'pending' | 'hidden'): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('comments').update({ status }).eq('id', id);
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase updateCommentStatus failed: ${error.message}`);
      }
      return true;
    }

    // Development only: Local JSON fallback
    const comments = readJsonFile<Comment[]>(COMMENTS_FILE, []);
    const comment = comments.find((c) => c.id === id);
    if (comment) {
      comment.status = status;
      writeJsonFile(COMMENTS_FILE, comments);

      if (isServerSupabaseConfigured()) {
        const supabase = getServerSupabaseClient();
        supabase?.from('comments').update({ status }).eq('id', id).then(() => {}, () => {});
      }
      return true;
    }
    return false;
  }

  async deleteComment(id: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase deleteComment failed: ${error.message}`);
      }
      return true;
    }

    // Development only: Local JSON fallback
    const comments = readJsonFile<Comment[]>(COMMENTS_FILE, []);
    writeJsonFile(
      COMMENTS_FILE,
      comments.filter((c) => c.id !== id)
    );

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase?.from('comments').delete().eq('id', id).then(() => {}, () => {});
    }
    return true;
  }
}

export const commentRepository = new CommentRepository();
