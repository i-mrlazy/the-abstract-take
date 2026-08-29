import { Review, RecommendationList } from '../../types';
import { SITE_CONFIG, getBaseUrl } from './site';
import { getCanonicalUrl } from './url';
import { normalizeScore } from '../utils/rating';

/**
 * Generates valid Schema.org Review structured data.
 * Correctly represents an individual critical review without fabricating aggregate ratings.
 */
export function generateReviewStructuredData(review: Review) {
  const normScore = normalizeScore(review.abstractScore);
  const canonicalUrl = getCanonicalUrl(`/reviews/${review.slug}`);
  const baseUrl = getBaseUrl();

  const isSeries = review.type === 'Series' || review.type === 'Mini Series';
  const itemReviewedType = isSeries ? 'TVSeries' : 'Movie';

  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': itemReviewedType,
      name: review.title,
      image: review.posterUrl,
      datePublished: String(review.releaseYear),
      director: review.director
        ? {
            '@type': 'Person',
            name: review.director,
          }
        : undefined,
      actor:
        Array.isArray(review.cast) && review.cast.length > 0
          ? review.cast.map((actorName) => ({
              '@type': 'Person',
              name: actorName,
            }))
          : undefined,
      genre: review.genres,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: normScore,
      bestRating: 10,
      worstRating: 1,
    },
    author: {
      '@type': 'Person',
      name: review.author?.name || SITE_CONFIG.creator.name,
      jobTitle: review.author?.title || SITE_CONFIG.creator.title,
      url: canonicalUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.ico`,
      },
    },
    datePublished: review.publishDate,
    dateModified: review.updatedDate || review.publishDate,
    reviewBody: review.longFormReview || review.myTake,
    headline: `${review.title} (${review.releaseYear}) Review — Abstract Score ${normScore}/10`,
    url: canonicalUrl,
  };
}

/**
 * Generates Schema.org ItemList for curated recommendation watchlists.
 */
export function generateRecommendationStructuredData(list: RecommendationList) {
  const canonicalUrl = getCanonicalUrl(`/recommends/${list.slug || list.id}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: list.title,
    description: list.description,
    numberOfItems: list.items?.length || 0,
    url: canonicalUrl,
    itemListElement: (list.items || []).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      description: item.curatorNote,
      image: item.posterUrl,
      url: item.reviewId ? getCanonicalUrl(`/reviews/${item.reviewId}`) : undefined,
    })),
  };
}

/**
 * Generates BreadcrumbList structured data for rich snippet navigation.
 */
export function generateBreadcrumbStructuredData(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

/**
 * Generates WebSite structured data for brand authority.
 */
export function generateWebSiteStructuredData() {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: baseUrl,
    description: SITE_CONFIG.description,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: baseUrl,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
