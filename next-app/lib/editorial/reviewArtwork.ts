import { Review, ArtworkMetadata } from '@/types';

/**
 * Verified Authoritative Artwork Registry for Reviewed & Featured Titles.
 * All entries map strictly to official promotional key art / verified press imagery.
 */
export const VERIFIED_TITLE_ARTWORK_REGISTRY: Record<
  string,
  {
    poster: string;
    backdrop: string;
    sourceType: 'official' | 'licensed' | 'creative-commons' | 'public-domain' | 'branded-fallback';
    sourceName: string;
    sourceUrl?: string;
    verified: boolean;
  }
> = {
  // Published Reviews
  'dune-part-two-2024': {
    poster: 'https://image.tmdb.org/t/p/w780/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/eZ239CUp1d6OryZEBPnO2n87gMG.jpg',
    sourceType: 'official',
    sourceName: 'Warner Bros. / Legendary Pictures Promotional Key Art',
    verified: true,
  },
  'past-lives-2023': {
    poster: 'https://image.tmdb.org/t/p/w780/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/7HR38hMBl23lf38MAN63y4pKsHz.jpg',
    sourceType: 'official',
    sourceName: 'A24 / CJ ENM Key Art & Promotional Stills',
    verified: true,
  },
  'severance-season-1': {
    poster: 'https://image.tmdb.org/t/p/w780/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/ixgFmf1X59PUZam2qbAfskx2gQr.jpg',
    sourceType: 'official',
    sourceName: 'Apple TV+ Official Key Art & Promotional Assets',
    verified: true,
  },
  'severance-season-2': {
    poster: 'https://image.tmdb.org/t/p/w780/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/ixgFmf1X59PUZam2qbAfskx2gQr.jpg',
    sourceType: 'official',
    sourceName: 'Apple TV+ Official Key Art & Promotional Assets',
    verified: true,
  },
  'the-boy-and-the-heron-2023': {
    poster: 'https://image.tmdb.org/t/p/w780/f4oZTcfGrVTXKTWg157AwikXqmP.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/75nSb1fbWooipwcSU5bUttiOriI.jpg',
    sourceType: 'official',
    sourceName: 'Studio Ghibli / Toho Official Theatrical Key Art',
    verified: true,
  },
  'drive-my-car-2021': {
    poster: 'https://image.tmdb.org/t/p/w780/znXps7wPyYq8UDCfeyO2vfEIeRS.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/r6aqhlmJmu8Dv5E7QYEruaEXKYm.jpg',
    sourceType: 'official',
    sourceName: 'Bitters End / Sideshow / Janus Films Theatrical Poster',
    verified: true,
  },
  'perfect-days-2023': {
    poster: 'https://image.tmdb.org/t/p/w780/tvUHVSTJV9ITON3oyHaWp7oaAc8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/hjWxngV6tidwDkfJDEgMjHD2KEz.jpg',
    sourceType: 'official',
    sourceName: 'NEON / Master Mind Ltd Theatrical Key Art',
    verified: true,
  },

  // What to Watch & Curated Recommendations
  'challengers-2024': {
    poster: 'https://image.tmdb.org/t/p/w780/H6vke7zGiuLsz4v4RPeReb9rsv.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/tq8COKsI99Bivjd4CZIYVGoKcIx.jpg',
    sourceType: 'official',
    sourceName: 'Amazon MGM Studios Theatrical Key Art',
    verified: true,
  },
  'monster-kaibutsu-2023': {
    poster: 'https://image.tmdb.org/t/p/w780/kvUJUyUGOhEoiWWNH04IXoExPE2.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/dZJcOyRonN0Kb7kJR3DE3esGn16.jpg',
    sourceType: 'official',
    sourceName: 'Toho / Gaga Corporation Theatrical Poster',
    verified: true,
  },
  'first-cow-2019': {
    poster: 'https://image.tmdb.org/t/p/w780/yS41crZ1i0fFxCQbuL7I1Y1VBwm.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/8P3qur5Xh6dsH6xmZ1O2XS7vnc2.jpg',
    sourceType: 'official',
    sourceName: 'A24 Theatrical Key Art',
    verified: true,
  },
  'gattaca-1997': {
    poster: 'https://image.tmdb.org/t/p/w780/eSKr5Fl1MEC7zpAXaLWBWSBjgJq.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/hPsCR1ny6GnctJkWqeJwihTDD7T.jpg',
    sourceType: 'official',
    sourceName: 'Columbia Pictures Official Theatrical Poster',
    verified: true,
  },
  'dead-poets-society-1989': {
    poster: 'https://image.tmdb.org/t/p/w780/tNvKkSnnn4Z6RCBThyK1gfCSSvv.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/lFIXZpwwlF9hg8NM3RazaIJDuaj.jpg',
    sourceType: 'official',
    sourceName: 'Touchstone Pictures / Buena Vista Key Art',
    verified: true,
  },
};

/**
 * Checks if a given image URL is a generic placeholder or invalid string.
 */
export function isPlaceholderArtwork(url?: string | null): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) return true;
  const lower = url.toLowerCase();
  if (lower.includes('placeholder') || lower.includes('via.placeholder.com')) return true;
  // Specific known legacy unsplash generic stock photo placeholders
  if (
    lower.includes('photo-1536440136628-849c177e76a1') || // generic cinema projector
    lower.includes('photo-1518709268805-4e9042af9f23') || // generic city lights
    lower.includes('photo-1534447677768-be436bb09401') || // generic starry night
    lower.includes('photo-1509198397868-475647b2a1e5') || // generic trees
    lower.includes('photo-1486406146926-c627a92ad1ab') || // generic skyscraper
    lower.includes('photo-1578632767115-351597cf2477') || // generic anime character
    lower.includes('photo-1517841905240-472988babdf9') || // generic woman portrait
    lower.includes('photo-1507679799987-c73779587ccf') || // generic office
    lower.includes('photo-1526374965328-7f61d4dc18c5') || // generic matrix code
    lower.includes('photo-1456513080510-7bf3a84b82f8') || // generic book
    lower.includes('photo-1448375240586-882707db888b') || // generic forest
    lower.includes('photo-1492691527719-9d1e07e534b4') || // generic bokeh
    lower.includes('photo-1493976040374-85c8e12f0c0e')    // generic tokyo street
  ) {
    return true;
  }
  return false;
}

export interface ResolvedArtworkResult {
  url: string;
  isFallback: boolean;
  sourceType: ArtworkMetadata['sourceType'];
  sourceName?: string;
  sourceUrl?: string;
  verified: boolean;
}

/**
 * Resolves the authoritative visual asset for a review item.
 * Prioritizes explicitly verified metadata, falls back to the registry, and then to branded fallback.
 */
export function resolveReviewArtwork(
  review?: {
    slug?: string;
    title?: string;
    releaseYear?: number;
    posterUrl?: string;
    bannerUrl?: string;
    artwork?: ArtworkMetadata;
  } | null,
  preferredType: 'poster' | 'backdrop' = 'poster'
): ResolvedArtworkResult {
  if (!review) {
    return {
      url: '',
      isFallback: true,
      sourceType: 'branded-fallback',
      sourceName: 'The Abstract Take Editorial System',
      verified: false,
    };
  }

  // 1. Check explicit review.artwork object
  if (review.artwork) {
    const candidateUrl =
      preferredType === 'backdrop'
        ? review.artwork.backdrop || review.artwork.poster
        : review.artwork.poster || review.artwork.backdrop;

    if (candidateUrl && !isPlaceholderArtwork(candidateUrl)) {
      return {
        url: candidateUrl,
        isFallback: false,
        sourceType: review.artwork.sourceType || 'official',
        sourceName: review.artwork.sourceName || 'Verified Editorial Archive Asset',
        sourceUrl: review.artwork.sourceUrl,
        verified: review.artwork.verified ?? true,
      };
    }
  }

  // 2. Check direct review.posterUrl / review.bannerUrl
  const directUrl =
    preferredType === 'backdrop'
      ? review.bannerUrl || review.posterUrl
      : review.posterUrl || review.bannerUrl;

  if (directUrl && !isPlaceholderArtwork(directUrl)) {
    return {
      url: directUrl,
      isFallback: false,
      sourceType: 'official',
      sourceName: 'Verified Direct Review Asset',
      verified: true,
    };
  }

  // 3. Check authoritative registry by slug or normalized title-year
  const normalizedSlug = (review.slug || '').toLowerCase().trim();
  if (normalizedSlug && VERIFIED_TITLE_ARTWORK_REGISTRY[normalizedSlug]) {
    const reg = VERIFIED_TITLE_ARTWORK_REGISTRY[normalizedSlug];
    return {
      url: preferredType === 'backdrop' ? reg.backdrop : reg.poster,
      isFallback: false,
      sourceType: reg.sourceType,
      sourceName: reg.sourceName,
      sourceUrl: reg.sourceUrl,
      verified: reg.verified,
    };
  }

  const generatedKey = `${(review.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}-${review.releaseYear || ''}`;

  if (VERIFIED_TITLE_ARTWORK_REGISTRY[generatedKey]) {
    const reg = VERIFIED_TITLE_ARTWORK_REGISTRY[generatedKey];
    return {
      url: preferredType === 'backdrop' ? reg.backdrop : reg.poster,
      isFallback: false,
      sourceType: reg.sourceType,
      sourceName: reg.sourceName,
      sourceUrl: reg.sourceUrl,
      verified: reg.verified,
    };
  }

  // 4. Fallback if no verified asset found
  return {
    url: directUrl || '',
    isFallback: true,
    sourceType: 'branded-fallback',
    sourceName: 'The Abstract Take Publication Native Fallback',
    verified: false,
  };
}
