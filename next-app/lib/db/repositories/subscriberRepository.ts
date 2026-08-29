import { NewsletterSubscriber } from '../../../types';
import { getServerSupabaseClient, isServerSupabaseConfigured } from '../../supabase/server';
import { readJsonFile, writeJsonFile } from '../fsUtils';

const SUBSCRIBERS_FILE = 'subscribers.json';

export class SubscriberRepository {
  async getAll(): Promise<NewsletterSubscriber[]> {
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .select('*')
          .order('subscribed_at', { ascending: false });
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getAll subscribers failed: ${error.message}`);
          }
          console.warn('[DEV NOTICE] Supabase query error, falling back to baseline subscribers:', error.message);
        } else if (data) {
          return data.map((row: any) => ({
            id: row.id,
            email: row.email,
            subscribedAt: row.subscribed_at,
            status: row.status || 'active',
            preference: row.preference || 'all',
          }));
        }
      }
    }

    return readJsonFile<NewsletterSubscriber[]>(SUBSCRIBERS_FILE, []);
  }

  async addSubscriber(
    email: string,
    preference = 'all'
  ): Promise<{ subscriber: NewsletterSubscriber; isNew: boolean }> {
    const cleanEmail = email.trim().toLowerCase();

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        // Check existing subscriber in Supabase
        const { data: existing, error: findError } = await supabase
          .from('newsletter_subscribers')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (findError) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase find subscriber failed: ${findError.message}`);
          }
          console.warn('[DEV NOTICE] Supabase find subscriber error:', findError.message);
        }

        if (existing) {
          if (existing.status === 'unsubscribed') {
            const { error: updateError } = await supabase
              .from('newsletter_subscribers')
              .update({ status: 'active', preference })
              .eq('id', existing.id);
            if (updateError) {
              throw new Error(`[DATABASE ERROR] Supabase update subscriber failed: ${updateError.message}`);
            }
          }
          return {
            subscriber: {
              id: existing.id,
              email: existing.email,
              subscribedAt: existing.subscribed_at,
              status: 'active',
              preference,
            },
            isNew: false,
          };
        }

        const newSub: NewsletterSubscriber = {
          id: `sub-${Date.now()}`,
          email: cleanEmail,
          subscribedAt: new Date().toISOString(),
          status: 'active',
          preference,
        };

        const { error: insertError } = await supabase.from('newsletter_subscribers').insert({
          id: newSub.id,
          email: newSub.email,
          subscribed_at: newSub.subscribedAt,
          status: newSub.status,
          preference: newSub.preference,
        });

        if (insertError) {
          throw new Error(`[DATABASE ERROR] Supabase insert subscriber failed: ${insertError.message}`);
        }

        return { subscriber: newSub, isNew: true };
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
    }

    // Development only: Local JSON fallback
    const subscribers = readJsonFile<NewsletterSubscriber[]>(SUBSCRIBERS_FILE, []);
    const existing = subscribers.find((s) => s.email.toLowerCase() === cleanEmail);

    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active';
        existing.preference = preference;
        writeJsonFile(SUBSCRIBERS_FILE, subscribers);
      }
      return { subscriber: existing, isNew: false };
    }

    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      status: 'active',
      preference,
    };

    subscribers.unshift(newSub);
    writeJsonFile(SUBSCRIBERS_FILE, subscribers);

    return { subscriber: newSub, isNew: true };
  }

  async removeSubscriber(id: string): Promise<boolean> {
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('newsletter_subscribers').delete().or(`id.eq.${id},email.eq.${id}`);
        if (error) {
          throw new Error(`[DATABASE ERROR] Supabase removeSubscriber failed: ${error.message}`);
        }
        return true;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
    }

    // Development only: Local JSON fallback
    const subscribers = readJsonFile<NewsletterSubscriber[]>(SUBSCRIBERS_FILE, []);
    const filtered = subscribers.filter((s) => s.id !== id && s.email !== id);
    writeJsonFile(SUBSCRIBERS_FILE, filtered);

    return true;
  }
}

export const subscriberRepository = new SubscriberRepository();
