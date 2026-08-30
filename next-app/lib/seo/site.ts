/**
 * Centralized Site and Publication SEO configuration for The Abstract Take.
 * Independent cinema, series, and anime critique publication.
 */

export const SITE_CONFIG = {
  name: 'The Abstract Take',
  tagline: 'Uncompromising Cinema & Television Critique',
  description:
    'An independent digital publication dedicated to uncompromising cinema critiques, long-form television essays, and creator-curated recommendations scored on the signature 1–10 Abstract Scale.',
  creator: {
    name: 'The Abstract Take',
    title: 'Chief Cinema Critic & Editor',
    twitterHandle: '@theabstracttake',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  defaultOgImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  minTagReviewsForIndexing: 3,
  minCategoryReviewsForIndexing: 1,
};

/**
 * Resolves the canonical base URL from environment configuration.
 * Fallbacks safely across development, preview, and production.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, '')}`;
  }
  if (process.env.VERCEL_URL && !process.env.VERCEL_URL.includes('-git-') && !process.env.VERCEL_URL.includes('.vercel.app')) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, '')}`;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return 'https://the-abstract-take.vercel.app';
}
