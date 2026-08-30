import { db } from '@/lib/db';
import type { Review, RecommendationList } from '@/types';
import { normalizeScore } from '@/lib/utils/rating';

export interface DiscoveryCriteria {
  mediaType?: string;
  genres?: string[];
  genre?: string;
  mood?: string;
  favoriteFilms?: string;
}

export interface MatchedReviewPick {
  id: string;
  slug: string;
  title: string;
  type: string;
  releaseYear: number;
  director: string;
  abstractScore: number;
  posterUrl: string;
  bannerUrl?: string;
  summary: string;
  editorialReason: string;
  genres: string[];
  matchScore: number;
}

export interface RecommendationEngineResult {
  headline: string;
  contextNote: string;
  reviewedMatches: MatchedReviewPick[];
  collectionMatches: RecommendationList[];
  criteria: DiscoveryCriteria;
}

/**
 * Searches and prioritizes reviews from the database matching user criteria.
 */
export async function matchReviewsByCriteria(
  criteria: DiscoveryCriteria
): Promise<RecommendationEngineResult> {
  const reviews = await db.getReviews();
  const allLists = await db.getRecommendationLists();

  const selectedType = criteria.mediaType && criteria.mediaType !== 'Any' ? criteria.mediaType.toLowerCase() : '';
  const selectedGenres = criteria.genres || (criteria.genre ? [criteria.genre] : []);
  const selectedMood = (criteria.mood || '').toLowerCase();

  // Score each review based on criteria match
  const scoredReviews: MatchedReviewPick[] = [];

  for (const review of reviews) {
    if (review.status && review.status !== 'published') continue;

    let score = 0;
    const reviewType = (review.type || '').toLowerCase();
    const reviewGenres = (review.genres || []).map((g) => g.toLowerCase());
    const reviewTags = (review.tags || []).map((t) => t.toLowerCase());
    const reviewText = `${review.title} ${review.myTake || ''} ${review.verdictText || ''} ${review.synopsis || ''} ${review.longFormReview || ''}`.toLowerCase();

    // 1. Format / Type Match
    if (selectedType) {
      if (reviewType === selectedType) {
        score += 30;
      } else if (selectedType === 'movie' && (reviewType === 'movies' || reviewType === 'feature')) {
        score += 30;
      } else if (selectedType === 'series' && (reviewType === 'mini series' || reviewType === 'tv')) {
        score += 25;
      } else {
        // Mismatch on strict format filter reduces priority
        score -= 20;
      }
    } else {
      score += 10;
    }

    // 2. Genre Match
    for (const g of selectedGenres) {
      const gLower = g.toLowerCase();
      if (reviewGenres.some((rg) => rg.includes(gLower) || gLower.includes(rg))) {
        score += 40;
      } else if (reviewTags.some((rt) => rt.includes(gLower) || gLower.includes(rt))) {
        score += 30;
      } else if (reviewText.includes(gLower)) {
        score += 15;
      }
    }

    // 3. Mood / Atmosphere Match
    if (selectedMood) {
      const moodKeywords = selectedMood
        .replace(/&/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      for (const kw of moodKeywords) {
        if (reviewText.includes(kw)) {
          score += 15;
        }
        if (reviewTags.some((rt) => rt.includes(kw))) {
          score += 20;
        }
      }
    }

    // 4. Quality boost from calibrated Abstract Score
    const normScore = normalizeScore(review.abstractScore);
    if (normScore >= 9) score += 15;
    else if (normScore >= 8) score += 10;
    else if (normScore >= 7) score += 5;

    // Reason generation
    let editorialReason = review.myTake || review.verdictText || 'Outstanding artistic vision worth experiencing.';
    if (selectedMood && editorialReason.length > 140) {
      editorialReason = editorialReason.slice(0, 137) + '...';
    }

    if (score > 0) {
      scoredReviews.push({
        id: review.id,
        slug: review.slug,
        title: review.title,
        type: review.type,
        releaseYear: review.releaseYear,
        director: review.director,
        abstractScore: normScore,
        posterUrl: review.posterUrl,
        bannerUrl: review.bannerUrl,
        summary: review.myTake || review.synopsis || review.verdictText || '',
        editorialReason,
        genres: review.genres || [],
        matchScore: score,
      });
    }
  }

  // Sort reviews by matchScore descending
  scoredReviews.sort((a, b) => b.matchScore - a.matchScore);

  // If no strict matches found, provide the highest rated reviews in the archive as fallback
  const topReviews = scoredReviews.length > 0
    ? scoredReviews.slice(0, 6)
    : reviews.slice(0, 4).map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        type: r.type,
        releaseYear: r.releaseYear,
        director: r.director,
        abstractScore: normalizeScore(r.abstractScore),
        posterUrl: r.posterUrl,
        bannerUrl: r.bannerUrl,
        summary: r.myTake || r.synopsis || r.verdictText || '',
        editorialReason: r.myTake || r.verdictText || 'Exceptional cinematic merit.',
        genres: r.genres || [],
        matchScore: 10,
      }));

  // Match curated collections
  const matchedLists: RecommendationList[] = [];
  for (const list of allLists) {
    const listText = `${list.title} ${list.description} ${list.category || ''} ${list.subtitle || ''}`.toLowerCase();
    let listScore = 0;

    for (const g of selectedGenres) {
      if (listText.includes(g.toLowerCase())) listScore += 20;
    }
    if (selectedMood) {
      const moodKeywords = selectedMood.split(/\s+/).filter((w) => w.length > 3);
      for (const kw of moodKeywords) {
        if (listText.includes(kw.toLowerCase())) listScore += 15;
      }
    }
    if (listScore > 0 || allLists.length <= 3) {
      matchedLists.push(list);
    }
  }

  // Generate dynamic headline and context note
  let headline = 'What Should I Watch Next?';
  const genreLabel = selectedGenres.length > 0 ? selectedGenres.join(' & ') : '';
  const typeLabel = criteria.mediaType && criteria.mediaType !== 'Any' ? `${criteria.mediaType}s` : 'Titles';

  if (genreLabel && selectedMood) {
    headline = `${selectedMood.split('&')[0].trim()} ${genreLabel} ${typeLabel} Worth Watching`;
  } else if (genreLabel) {
    headline = `${genreLabel} ${typeLabel} Worth Watching`;
  } else if (selectedMood) {
    headline = `${criteria.mood} ${typeLabel} You Should Experience`;
  }

  let contextNote = 'Handpicked by The Abstract Take based on artistic caliber and storytelling rigor.';
  if (selectedMood && genreLabel) {
    contextNote = `Based on your preference for ${selectedMood.toLowerCase()} ${genreLabel.toLowerCase()}, here are the titles The Abstract Take believes are truly worth your time.`;
  } else if (selectedMood) {
    contextNote = `Curated for a ${selectedMood.toLowerCase()} viewing experience, scored strictly on our signature 1–10 Abstract Scale.`;
  } else if (genreLabel) {
    contextNote = `The definitive ${genreLabel.toLowerCase()} selections from our editorial critique archives.`;
  }

  return {
    headline,
    contextNote,
    reviewedMatches: topReviews,
    collectionMatches: matchedLists.slice(0, 3),
    criteria,
  };
}
