import { getBaseUrl } from './site';

/**
 * Builds a clean canonical URL for any route path.
 */
export function getCanonicalUrl(path = ''): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath === '/' ? '' : cleanPath}`;
}

/**
 * Builds an OpenGraph social image URL.
 * Automatically delegates to the dynamic OG image generator route (/api/og) or falls back to an absolute media URL.
 */
export function getOgImageUrl(params: {
  title?: string;
  score?: number;
  year?: number;
  type?: string;
  director?: string;
  descriptor?: string;
  fallbackImage?: string;
}): string {
  const baseUrl = getBaseUrl();

  if (!params.title) {
    return params.fallbackImage || `${baseUrl}/api/og`;
  }

  const searchParams = new URLSearchParams();
  if (params.title) searchParams.set('title', params.title);
  if (params.score !== undefined) searchParams.set('score', String(params.score));
  if (params.year) searchParams.set('year', String(params.year));
  if (params.type) searchParams.set('type', params.type);
  if (params.director) searchParams.set('director', params.director);
  if (params.descriptor) searchParams.set('descriptor', params.descriptor);

  return `${baseUrl}/api/og?${searchParams.toString()}`;
}
