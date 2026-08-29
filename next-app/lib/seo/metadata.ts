import type { Metadata } from 'next';
import { Review, RecommendationList } from '../../types';
import { SITE_CONFIG } from './site';
import { getCanonicalUrl, getOgImageUrl } from './url';
import { normalizeScore, getQualityLabel } from '../utils/rating';

/**
 * Cleanly truncates meta description text without breaking words.
 */
function cleanExcerpt(text: string, maxLength = 160): string {
  if (!text) return SITE_CONFIG.description;
  const stripped = text.replace(/[*_#`]/g, '').trim();
  if (stripped.length <= maxLength) return stripped;
  const truncated = stripped.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? `${truncated.substring(0, lastSpace)}...` : `${truncated}...`;
}

/**
 * Builds metadata for an individual review page.
 */
export function buildReviewMetadata(review: Review): Metadata {
  const normScore = normalizeScore(review.abstractScore);
  const qualityLabel = getQualityLabel(normScore);
  const title = `${review.title} (${review.releaseYear}) Review — Abstract Score ${normScore}/10 | ${SITE_CONFIG.name}`;

  // Description fallback hierarchy: SEO description -> myTake hook -> verdictText -> longFormReview excerpt
  const description = cleanExcerpt(
    review.seo?.metaDescription ||
      review.myTake ||
      review.verdictText ||
      review.longFormReview
  );

  const canonicalUrl = getCanonicalUrl(`/reviews/${review.slug}`);
  const ogImageUrl = getOgImageUrl({
    title: review.title,
    score: normScore,
    year: review.releaseYear,
    type: review.type,
    director: review.director,
    descriptor: qualityLabel,
    fallbackImage: review.bannerUrl || review.posterUrl,
  });

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${review.title} (${review.releaseYear}) — Abstract Score ${normScore}/10`,
        },
      ],
      type: 'article',
      publishedTime: review.publishDate,
      authors: [review.author?.name || SITE_CONFIG.creator.name],
      tags: review.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: SITE_CONFIG.creator.twitterHandle,
    },
  };
}

/**
 * Builds metadata for a curated recommendation watchlist collection.
 */
export function buildRecommendationMetadata(list: RecommendationList): Metadata {
  const title = `${list.title} | ${SITE_CONFIG.name} Recommends`;
  const description = cleanExcerpt(
    list.description || `Curated watchlist of ${list.items?.length || 0} films and series handpicked on ${SITE_CONFIG.name}.`
  );
  const canonicalUrl = getCanonicalUrl(`/recommends/${list.slug || list.id}`);
  const ogImageUrl = list.coverUrl || getOgImageUrl({ title: list.title, fallbackImage: SITE_CONFIG.defaultOgImage });

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: list.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: SITE_CONFIG.creator.twitterHandle,
    },
  };
}

/**
 * Builds metadata for media format archives.
 */
export function buildArchiveMetadata(options: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${options.title} | ${SITE_CONFIG.name}`;
  const canonicalUrl = getCanonicalUrl(options.path);

  return {
    title: fullTitle,
    description: options.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: options.description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      images: [{ url: SITE_CONFIG.defaultOgImage, width: 1200, height: 630, alt: options.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: options.description,
      images: [SITE_CONFIG.defaultOgImage],
      creator: SITE_CONFIG.creator.twitterHandle,
    },
  };
}

/**
 * Builds metadata for tag taxonomy archives with thin content index/noindex controls.
 */
export function buildTagMetadata(tagName: string, slug: string, reviewCount: number): Metadata {
  const title = `Reviews Tagged #${tagName} | ${SITE_CONFIG.name}`;
  const description = `Editorial cinema critiques and analyses exploring #${tagName} themes on ${SITE_CONFIG.name}.`;
  const canonicalUrl = getCanonicalUrl(`/tags/${slug}`);
  const isIndexable = reviewCount >= SITE_CONFIG.minTagReviewsForIndexing;

  return {
    title,
    description,
    robots: {
      index: isIndexable,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
    },
  };
}

/**
 * Builds metadata for category / genre archives with thin content index/noindex controls.
 */
export function buildCategoryMetadata(categoryName: string, slug: string, reviewCount: number): Metadata {
  const title = `${categoryName} Film & TV Reviews | ${SITE_CONFIG.name}`;
  const description = `Independent critical reviews and Abstract Scores for ${categoryName} movies, series, and anime.`;
  const canonicalUrl = getCanonicalUrl(`/category/${slug}`);
  const isIndexable = reviewCount >= SITE_CONFIG.minCategoryReviewsForIndexing;

  return {
    title,
    description,
    robots: {
      index: isIndexable,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
    },
  };
}
