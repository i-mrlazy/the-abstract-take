import { RecommendationList } from '../../../types';
import { getServerSupabaseClient, isServerSupabaseConfigured } from '../../supabase/server';
import { readJsonFile, writeJsonFile } from '../fsUtils';

const RECOMMENDS_FILE = 'recommendations.json';

export class RecommendationRepository {
  async getAll(includeDrafts = false): Promise<RecommendationList[]> {
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        let query = supabase.from('recommendation_lists').select('*').order('updated_date', { ascending: false });
        if (!includeDrafts) {
          query = query.eq('status', 'published');
        }
        const { data, error } = await query;
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getAll recommendations failed: ${error.message}`);
          }
        } else if (data) {
          return data.map((row: any) => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
            subtitle: row.subtitle,
            coverUrl: row.cover_url,
            status: row.status,
            category: row.category,
            description: row.description,
            curatorName: row.curator_name,
            items: row.items || [],
            updatedDate: row.updated_date,
            readsCount: row.reads_count,
            isFeatured: row.is_featured,
          }));
        }
      }
    }

    const lists = readJsonFile<RecommendationList[]>(RECOMMENDS_FILE, []);
    if (includeDrafts) return lists;
    return lists.filter((l) => l.status === 'published' || !l.status);
  }

  async getBySlug(slug: string): Promise<RecommendationList | null> {
    const cleanSlug = slug.toLowerCase().trim();
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('recommendation_lists').select('*').eq('slug', cleanSlug).maybeSingle();
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getBySlug recommendation failed: ${error.message}`);
          }
        } else if (data) {
          return {
            id: data.id,
            slug: data.slug,
            title: data.title,
            subtitle: data.subtitle,
            coverUrl: data.cover_url,
            status: data.status,
            category: data.category,
            description: data.description,
            curatorName: data.curator_name,
            items: data.items || [],
            updatedDate: data.updated_date,
            readsCount: data.reads_count,
            isFeatured: data.is_featured,
          };
        }
      }
    }

    const lists = readJsonFile<RecommendationList[]>(RECOMMENDS_FILE, []);
    return lists.find((l) => (l.slug && l.slug.toLowerCase() === cleanSlug) || l.id === cleanSlug) || null;
  }

  async saveList(list: RecommendationList): Promise<RecommendationList> {
    if (!list.id) {
      list.id = `rec-${Date.now()}`;
    }
    list.updatedDate = new Date().toISOString().split('T')[0];

    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('recommendation_lists').upsert({
        id: list.id,
        slug: list.slug,
        title: list.title,
        subtitle: list.subtitle,
        cover_url: list.coverUrl,
        status: list.status,
        category: list.category,
        description: list.description,
        curator_name: list.curatorName,
        items: list.items,
        updated_date: list.updatedDate,
        reads_count: list.readsCount || 0,
        is_featured: list.isFeatured || false,
      });
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase saveList failed: ${error.message}`);
      }
      return list;
    }

    // Development only: Local JSON fallback
    const lists = readJsonFile<RecommendationList[]>(RECOMMENDS_FILE, []);
    const index = lists.findIndex((l) => l.id === list.id);
    if (index >= 0) {
      lists[index] = list;
    } else {
      lists.unshift(list);
    }
    writeJsonFile(RECOMMENDS_FILE, lists);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase
        ?.from('recommendation_lists')
        .upsert({
          id: list.id,
          slug: list.slug,
          title: list.title,
          subtitle: list.subtitle,
          cover_url: list.coverUrl,
          status: list.status,
          category: list.category,
          description: list.description,
          curator_name: list.curatorName,
          items: list.items,
          updated_date: list.updatedDate,
          reads_count: list.readsCount || 0,
          is_featured: list.isFeatured || false,
        })
        .then(() => {}, () => {});
    }

    return list;
  }

  async deleteList(id: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('recommendation_lists').delete().eq('id', id);
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase deleteList failed: ${error.message}`);
      }
      return true;
    }

    // Development only: Local JSON fallback
    const lists = readJsonFile<RecommendationList[]>(RECOMMENDS_FILE, []);
    const filtered = lists.filter((l) => l.id !== id);
    writeJsonFile(RECOMMENDS_FILE, filtered);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase?.from('recommendation_lists').delete().eq('id', id).then(() => {}, () => {});
    }

    return true;
  }
}

export const recommendationRepository = new RecommendationRepository();
