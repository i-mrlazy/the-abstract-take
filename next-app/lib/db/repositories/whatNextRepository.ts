import { WhatToWatchNextItem } from '../../../types';
import { getServerSupabaseClient, isServerSupabaseConfigured } from '../../supabase/server';
import { readJsonFile, writeJsonFile } from '../fsUtils';

const WHAT_NEXT_FILE = 'what_next.json';

export class WhatNextRepository {
  async getAll(): Promise<WhatToWatchNextItem[]> {
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('what_to_watch_next').select('*').order('publish_date', { ascending: false });
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getAll what_to_watch_next failed: ${error.message}`);
          }
        } else if (data) {
          return data.map((row: any) => ({
            id: row.id,
            title: row.title,
            type: row.type,
            releaseYear: row.release_year,
            director: row.director,
            posterUrl: row.poster_url,
            bannerUrl: row.banner_url,
            abstractScore: row.abstract_score,
            moodTag: row.mood_tag,
            personalCommentary: row.personal_commentary,
            whereToWatch: row.where_to_watch,
            publishDate: row.publish_date,
            status: row.status,
            scheduledDate: row.scheduled_date,
            readyForNewsletter: row.ready_for_newsletter,
          }));
        }
      }
    }

    return readJsonFile<WhatToWatchNextItem[]>(WHAT_NEXT_FILE, []);
  }

  async saveItem(item: WhatToWatchNextItem): Promise<WhatToWatchNextItem> {
    if (!item.id) {
      item.id = `next-${Date.now()}`;
    }
    item.publishDate = item.publishDate || new Date().toISOString().split('T')[0];

    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('what_to_watch_next').upsert({
        id: item.id,
        title: item.title,
        type: item.type,
        release_year: item.releaseYear,
        director: item.director,
        poster_url: item.posterUrl,
        banner_url: item.bannerUrl,
        abstract_score: item.abstractScore,
        mood_tag: item.moodTag,
        personal_commentary: item.personalCommentary,
        where_to_watch: item.whereToWatch,
        publish_date: item.publishDate,
        status: item.status || 'published',
        scheduled_date: item.scheduledDate,
        ready_for_newsletter: item.readyForNewsletter,
      });
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase saveItem failed: ${error.message}`);
      }
      return item;
    }

    // Development only: Local JSON fallback
    const items = readJsonFile<WhatToWatchNextItem[]>(WHAT_NEXT_FILE, []);
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.unshift(item);
    }
    writeJsonFile(WHAT_NEXT_FILE, items);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase
        ?.from('what_to_watch_next')
        .upsert({
          id: item.id,
          title: item.title,
          type: item.type,
          release_year: item.releaseYear,
          director: item.director,
          poster_url: item.posterUrl,
          banner_url: item.bannerUrl,
          abstract_score: item.abstractScore,
          mood_tag: item.moodTag,
          personal_commentary: item.personalCommentary,
          where_to_watch: item.whereToWatch,
          publish_date: item.publishDate,
          status: item.status || 'published',
          scheduled_date: item.scheduledDate,
          ready_for_newsletter: item.readyForNewsletter,
        })
        .then(() => {}, () => {});
    }

    return item;
  }

  async deleteItem(id: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('what_to_watch_next').delete().eq('id', id);
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase deleteItem failed: ${error.message}`);
      }
      return true;
    }

    // Development only: Local JSON fallback
    const items = readJsonFile<WhatToWatchNextItem[]>(WHAT_NEXT_FILE, []);
    const filtered = items.filter((i) => i.id !== id);
    writeJsonFile(WHAT_NEXT_FILE, filtered);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase?.from('what_to_watch_next').delete().eq('id', id).then(() => {}, () => {});
    }

    return true;
  }
}

export const whatNextRepository = new WhatNextRepository();
