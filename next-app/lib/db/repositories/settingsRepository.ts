import { SiteSettings } from '../../../types';
import { getServerSupabaseClient, isServerSupabaseConfigured } from '../../supabase/server';
import { readJsonFile, writeJsonFile } from '../fsUtils';

const SETTINGS_FILE = 'settings.json';

export const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: 'The Abstract Take',
  siteTagline: 'Uncompromising Cinema & Television Critique',
  creatorName: 'The Abstract Take',
  creatorBio: 'Independent critical takes, in-depth film essays, and the authoritative Abstract Score.',
  creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  twitterUrl: 'https://twitter.com',
  letterboxdUrl: 'https://letterboxd.com',
  contactEmail: 'theabstractlens.official@gmail.com',
  defaultOgImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  analyticsId: '',
  newsletterHeadline: 'The Abstract Dispatch',
  newsletterSubheadline: 'Weekly unfiltered cinema critiques, hidden gems, and curated watchlist drops.',
  enableComments: true,
  autoApproveComments: false,
};

export class SettingsRepository {
  async getSettings(): Promise<SiteSettings> {
    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
        if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`[DATABASE ERROR] Supabase getSettings failed: ${error.message}`);
          }
        } else if (data) {
          return {
            siteTitle: data.site_title || DEFAULT_SETTINGS.siteTitle,
            siteTagline: data.site_tagline || DEFAULT_SETTINGS.siteTagline,
            creatorName: data.creator_name || DEFAULT_SETTINGS.creatorName,
            creatorBio: data.creator_bio || DEFAULT_SETTINGS.creatorBio,
            creatorAvatar: data.creator_avatar || DEFAULT_SETTINGS.creatorAvatar,
            twitterUrl: data.twitter_url || DEFAULT_SETTINGS.twitterUrl,
            letterboxdUrl: data.letterboxd_url || DEFAULT_SETTINGS.letterboxdUrl,
            contactEmail: data.contact_email || DEFAULT_SETTINGS.contactEmail,
            defaultOgImage: data.default_og_image || DEFAULT_SETTINGS.defaultOgImage,
            analyticsId: data.analytics_id || DEFAULT_SETTINGS.analyticsId,
            newsletterHeadline: data.newsletter_headline || DEFAULT_SETTINGS.newsletterHeadline,
            newsletterSubheadline: data.newsletter_subheadline || DEFAULT_SETTINGS.newsletterSubheadline,
            enableComments: data.enable_comments ?? DEFAULT_SETTINGS.enableComments,
            autoApproveComments: data.auto_approve_comments ?? DEFAULT_SETTINGS.autoApproveComments,
          };
        }
      }
    }

    return readJsonFile<SiteSettings>(SETTINGS_FILE, DEFAULT_SETTINGS);
  }

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.getSettings();
    const merged: SiteSettings = {
      ...current,
      ...updates,
    };

    if (process.env.NODE_ENV === 'production') {
      if (!isServerSupabaseConfigured()) {
        throw new Error('[DATABASE FATAL] Supabase PostgreSQL is required in production, but is not configured.');
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        throw new Error('[DATABASE FATAL] Failed to initialize Supabase client in production.');
      }
      const { error } = await supabase.from('site_settings').upsert({
        id: 1,
        site_title: merged.siteTitle,
        site_tagline: merged.siteTagline,
        creator_name: merged.creatorName,
        creator_bio: merged.creatorBio,
        creator_avatar: merged.creatorAvatar,
        twitter_url: merged.twitterUrl,
        letterboxd_url: merged.letterboxdUrl,
        contact_email: merged.contactEmail,
        default_og_image: merged.defaultOgImage,
        analytics_id: merged.analyticsId,
        newsletter_headline: merged.newsletterHeadline,
        newsletter_subheadline: merged.newsletterSubheadline,
        enable_comments: merged.enableComments,
        auto_approve_comments: merged.autoApproveComments,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        throw new Error(`[DATABASE ERROR] Supabase updateSettings failed: ${error.message}`);
      }
      return merged;
    }

    // Development only: Local JSON fallback
    writeJsonFile(SETTINGS_FILE, merged);

    if (isServerSupabaseConfigured()) {
      const supabase = getServerSupabaseClient();
      supabase
        ?.from('site_settings')
        .upsert({
          id: 1,
          site_title: merged.siteTitle,
          site_tagline: merged.siteTagline,
          creator_name: merged.creatorName,
          creator_bio: merged.creatorBio,
          creator_avatar: merged.creatorAvatar,
          twitter_url: merged.twitterUrl,
          letterboxd_url: merged.letterboxdUrl,
          contact_email: merged.contactEmail,
          default_og_image: merged.defaultOgImage,
          analytics_id: merged.analyticsId,
          newsletter_headline: merged.newsletterHeadline,
          newsletter_subheadline: merged.newsletterSubheadline,
          enable_comments: merged.enableComments,
          auto_approve_comments: merged.autoApproveComments,
          updated_at: new Date().toISOString(),
        })
        .then(() => {}, () => {});
    }

    return merged;
  }
}

export const settingsRepository = new SettingsRepository();
