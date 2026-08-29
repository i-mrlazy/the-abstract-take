import { getServerSupabaseClient, isServerSupabaseConfigured } from '../../supabase/server';
import { readJsonFile, writeJsonFile } from '../fsUtils';

const TAGS_FILE = 'tags.json';

const DEFAULT_TAGS = [
  'Must Watch',
  'Personal Favorites',
  'Masterpiece',
  'Auteur',
  'Cult Classic',
  'Cinematography',
  'Sci-Fi',
  'Psychological',
  'Atmospheric',
  'Neo-Noir',
  'Modern Classic',
  'Hidden Gem',
  'Festival Circuit',
];

export class TagRepository {
  async getTags(): Promise<string[]> {
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('tags').select('name').order('name', { ascending: true });
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getTags failed: ${error.message}`);
          }
        } else if (data && data.length > 0) {
          return data.map((t: any) => t.name);
        }
      }
    }

    return readJsonFile<string[]>(TAGS_FILE, DEFAULT_TAGS);
  }

  async addTag(tag: string): Promise<string[]> {
    const cleanTag = tag.trim();
    if (!cleanTag) return this.getTags();

    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('tags').upsert({ name: cleanTag });
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase addTag failed: ${error.message}`);
      }
      return this.getTags();
    }

    // Development only: Local JSON fallback
    const tags = readJsonFile<string[]>(TAGS_FILE, DEFAULT_TAGS);
    if (!tags.includes(cleanTag)) {
      tags.push(cleanTag);
      writeJsonFile(TAGS_FILE, tags);

      if (isServerSupabaseConfigured()) {
        const supabase = getServerSupabaseClient();
        supabase?.from('tags').upsert({ name: cleanTag }).then(() => {}, () => {});
      }
    }

    return tags;
  }

  async deleteTag(tag: string): Promise<string[]> {
    const cleanTag = tag.trim();

    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('tags').delete().eq('name', cleanTag);
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase deleteTag failed: ${error.message}`);
      }
      return this.getTags();
    }

    // Development only: Local JSON fallback
    const tags = readJsonFile<string[]>(TAGS_FILE, DEFAULT_TAGS);
    const updated = tags.filter((t) => t.toLowerCase() !== cleanTag.toLowerCase());
    writeJsonFile(TAGS_FILE, updated);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase?.from('tags').delete().eq('name', cleanTag).then(() => {}, () => {});
    }

    return updated;
  }
}

export const tagRepository = new TagRepository();
