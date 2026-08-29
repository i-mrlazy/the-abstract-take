import { MetadataRoute } from 'next';
import { db } from '../lib/db';
import { getBaseUrl, SITE_CONFIG } from '../lib/seo/site';
import { slugify } from '../lib/utils/slug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const currentDate = new Date().toISOString();

  // 1. Static Core Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/movies`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/series`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/anime`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/documentaries`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mini-series`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/specials`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/recommends`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/what-to-watch-next`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Published Reviews
  const reviews = await db.getReviews(false);
  const reviewRoutes: MetadataRoute.Sitemap = reviews.map((review) => ({
    url: `${baseUrl}/reviews/${review.slug}`,
    lastModified: review.updatedDate || review.publishDate || currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // 3. Published Recommendation Lists
  const recLists = await db.getRecommendationLists(false);
  const recRoutes: MetadataRoute.Sitemap = recLists.map((list) => ({
    url: `${baseUrl}/recommends/${list.slug || list.id}`,
    lastModified: list.updatedDate || currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 4. Meaningful Category Archives
  const categoryCounts = new Map<string, number>();
  reviews.forEach((r) => {
    if (r.category) {
      const catSlug = slugify(r.category);
      categoryCounts.set(catSlug, (categoryCounts.get(catSlug) || 0) + 1);
    }
    if (Array.isArray(r.genres)) {
      r.genres.forEach((g) => {
        const genreSlug = slugify(g);
        categoryCounts.set(genreSlug, (categoryCounts.get(genreSlug) || 0) + 1);
      });
    }
  });

  const categoryRoutes: MetadataRoute.Sitemap = [];
  categoryCounts.forEach((count, catSlug) => {
    if (count >= SITE_CONFIG.minCategoryReviewsForIndexing) {
      categoryRoutes.push({
        url: `${baseUrl}/category/${catSlug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  });

  // 5. Meaningful Tag Archives (Filtered by MIN_TAG_REVIEWS_FOR_INDEXING threshold)
  const tagCounts = new Map<string, number>();
  reviews.forEach((r) => {
    if (Array.isArray(r.tags)) {
      r.tags.forEach((t) => {
        const tagSlug = slugify(t);
        tagCounts.set(tagSlug, (tagCounts.get(tagSlug) || 0) + 1);
      });
    }
  });

  const tagRoutes: MetadataRoute.Sitemap = [];
  tagCounts.forEach((count, tagSlug) => {
    if (count >= SITE_CONFIG.minTagReviewsForIndexing) {
      tagRoutes.push({
        url: `${baseUrl}/tags/${tagSlug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  });

  return [
    ...staticRoutes,
    ...reviewRoutes,
    ...recRoutes,
    ...categoryRoutes,
    ...tagRoutes,
  ];
}
