import { revalidatePath, revalidateTag } from 'next/cache';
import { slugify } from '../utils/slug';

export interface ContentRevalidationPayload {
  slug: string;
  type?: string;
  genres?: string[];
  tags?: string[];
  category?: string;
}

/**
 * Revalidates all routes associated with a published or updated review.
 */
export async function revalidateReviewContent(payload: ContentRevalidationPayload): Promise<{ success: boolean; invalidatedPaths: string[] }> {
  const invalidatedPaths: string[] = [];

  try {
    // 1. Core publication routes
    revalidatePath('/');
    invalidatedPaths.push('/');

    revalidatePath('/reviews');
    invalidatedPaths.push('/reviews');

    if (payload.slug) {
      const reviewPath = `/reviews/${payload.slug}`;
      revalidatePath(reviewPath);
      invalidatedPaths.push(reviewPath);
    }

    // 2. Format / Media Type archive
    if (payload.type) {
      const typeSlugMap: Record<string, string> = {
        Movie: '/movies',
        Series: '/series',
        Anime: '/anime',
        Documentary: '/documentaries',
        'Mini Series': '/mini-series',
        Special: '/specials',
      };
      const pathForType = typeSlugMap[payload.type];
      if (pathForType) {
        revalidatePath(pathForType);
        invalidatedPaths.push(pathForType);
      }
    }

    // 3. Category / Genre archives
    if (payload.genres && Array.isArray(payload.genres)) {
      for (const genre of payload.genres) {
        const catPath = `/category/${slugify(genre)}`;
        revalidatePath(catPath);
        invalidatedPaths.push(catPath);
      }
    }

    // 4. Tag archives
    if (payload.tags && Array.isArray(payload.tags)) {
      for (const tag of payload.tags) {
        const tagPath = `/tags/${slugify(tag)}`;
        revalidatePath(tagPath);
        invalidatedPaths.push(tagPath);
      }
    }

    // 5. Search path
    revalidatePath('/search');
    invalidatedPaths.push('/search');

    return { success: true, invalidatedPaths };
  } catch (err: any) {
    console.error('[Cache Revalidation Error]', err);
    return { success: false, invalidatedPaths };
  }
}

/**
 * Revalidates recommendation collections.
 */
export async function revalidateRecommendationContent(slug?: string): Promise<{ success: boolean; invalidatedPaths: string[] }> {
  const invalidatedPaths: string[] = [];
  try {
    revalidatePath('/');
    invalidatedPaths.push('/');

    revalidatePath('/recommends');
    invalidatedPaths.push('/recommends');

    if (slug) {
      const recPath = `/recommends/${slug}`;
      revalidatePath(recPath);
      invalidatedPaths.push(recPath);
    }

    return { success: true, invalidatedPaths };
  } catch (err: any) {
    console.error('[Cache Revalidation Error]', err);
    return { success: false, invalidatedPaths };
  }
}

/**
 * Revalidates What to Watch Next discovery feed.
 */
export async function revalidateWhatToWatchContent(): Promise<{ success: boolean; invalidatedPaths: string[] }> {
  const invalidatedPaths: string[] = [];
  try {
    revalidatePath('/');
    invalidatedPaths.push('/');

    revalidatePath('/what-to-watch-next');
    invalidatedPaths.push('/what-to-watch-next');

    return { success: true, invalidatedPaths };
  } catch (err: any) {
    console.error('[Cache Revalidation Error]', err);
    return { success: false, invalidatedPaths };
  }
}
