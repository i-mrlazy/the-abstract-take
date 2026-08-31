/**
 * Authoritative Media Type Normalization Utility
 * Ensures consistent canonical media type filtering across UI, Recommendation Engine, and API routes.
 */

export type CanonicalMediaType =
  | 'movie'
  | 'series'
  | 'anime'
  | 'documentary'
  | 'mini-series'
  | 'special'
  | 'any';

/**
 * Normalizes any human-entered or legacy string to a strict CanonicalMediaType.
 */
export function normalizeMediaType(type?: string | null): CanonicalMediaType {
  if (!type) return 'any';
  const cleaned = type.toLowerCase().trim().replace(/[\s_-]+/g, '');

  if (
    cleaned === 'movie' ||
    cleaned === 'movies' ||
    cleaned === 'film' ||
    cleaned === 'films' ||
    cleaned === 'feature' ||
    cleaned === 'featurefilm' ||
    cleaned === 'featuremovie'
  ) {
    return 'movie';
  }

  if (
    cleaned === 'series' ||
    cleaned === 'tvseries' ||
    cleaned === 'tv' ||
    cleaned === 'television' ||
    cleaned === 'show' ||
    cleaned === 'shows' ||
    cleaned === 'tvshow'
  ) {
    return 'series';
  }

  if (
    cleaned === 'anime' ||
    cleaned === 'animation' ||
    cleaned === 'animefeature' ||
    cleaned === 'animeseries'
  ) {
    return 'anime';
  }

  if (
    cleaned === 'documentary' ||
    cleaned === 'documentaries' ||
    cleaned === 'doc' ||
    cleaned === 'docs'
  ) {
    return 'documentary';
  }

  if (
    cleaned === 'miniseries' ||
    cleaned === 'limitedseries' ||
    cleaned === 'miniserie'
  ) {
    return 'mini-series';
  }

  if (
    cleaned === 'special' ||
    cleaned === 'specials' ||
    cleaned === 'standalone'
  ) {
    return 'special';
  }

  if (cleaned === 'any' || cleaned === 'all' || cleaned === '') {
    return 'any';
  }

  return 'any';
}

/**
 * Validates if an item's media type strictly matches the requested target media type.
 * When targetType is 'any', all items match.
 */
export function isMediaTypeMatch(
  itemType: string | undefined | null,
  targetType: string | undefined | null
): boolean {
  const target = normalizeMediaType(targetType);
  if (target === 'any') return true;

  const item = normalizeMediaType(itemType);
  return item === target;
}

/**
 * Returns formatted UI label for a given media type.
 */
export function getDisplayMediaType(type: CanonicalMediaType | string): string {
  const canonical = normalizeMediaType(type);
  switch (canonical) {
    case 'movie':
      return 'Movie';
    case 'series':
      return 'Series';
    case 'anime':
      return 'Anime';
    case 'documentary':
      return 'Documentary';
    case 'mini-series':
      return 'Mini-Series';
    case 'special':
      return 'Special';
    case 'any':
    default:
      return 'Any Format';
  }
}
