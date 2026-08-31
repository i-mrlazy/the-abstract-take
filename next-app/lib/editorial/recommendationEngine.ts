import { db } from '@/lib/db';
import type { Review, RecommendationList } from '@/types';
import { normalizeScore } from '@/lib/utils/rating';
import { normalizeMediaType, isMediaTypeMatch, getDisplayMediaType, CanonicalMediaType } from '@/lib/utils/mediaType';

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
  canonicalType: CanonicalMediaType;
}

/**
 * Searches and prioritizes reviews from the database matching user criteria.
 * Enforces strict Media Type hard-filtering as Level 1 constraint.
 */
export async function matchReviewsByCriteria(
  criteria: DiscoveryCriteria
): Promise<RecommendationEngineResult> {
  const allReviews = await db.getReviews();
  const allLists = await db.getRecommendationLists();

  const targetType = normalizeMediaType(criteria.mediaType);
  const selectedGenres = (criteria.genres && criteria.genres.length > 0)
    ? criteria.genres
    : (criteria.genre ? [criteria.genre] : []);
  const selectedMood = (criteria.mood || '').trim().toLowerCase();
  const referenceQuery = (criteria.favoriteFilms || '').trim().toLowerCase();

  // --------------------------------------------------------------------------
  // STEP 1: HARD FILTER BY MEDIA TYPE (Level 1 Constraint)
  // --------------------------------------------------------------------------
  const eligibleReviews = allReviews.filter((r) => {
    if (r.status && r.status !== 'published') return false;
    // Strict media type match: Non-matching media types are permanently excluded
    return isMediaTypeMatch(r.type, targetType);
  });

  // --------------------------------------------------------------------------
  // STEP 2: SCORE AND RANK WITHIN THE FILTERED POOL
  // --------------------------------------------------------------------------
  const scoredReviews: MatchedReviewPick[] = [];

  for (const review of eligibleReviews) {
    let score = 0;
    const reviewGenres = (review.genres || []).map((g) => g.toLowerCase());
    const reviewTags = (review.tags || []).map((t) => t.toLowerCase());
    const reviewText = `${review.title} ${review.myTake || ''} ${review.verdictText || ''} ${review.synopsis || ''} ${review.longFormReview || ''}`.toLowerCase();

    // 1. Exact & Multi-Genre Matching (Level 2 Constraint)
    let matchedGenreCount = 0;
    for (const g of selectedGenres) {
      const gLower = g.toLowerCase();
      if (reviewGenres.some((rg) => rg === gLower || rg.includes(gLower) || gLower.includes(rg))) {
        score += 50;
        matchedGenreCount++;
      } else if (reviewTags.some((rt) => rt === gLower || rt.includes(gLower) || gLower.includes(rt))) {
        score += 35;
        matchedGenreCount++;
      } else if (reviewText.includes(gLower)) {
        score += 20;
        matchedGenreCount++;
      }
    }
    // Bonus for matching multiple requested genres
    if (matchedGenreCount > 1) {
      score += matchedGenreCount * 25;
    }

    // 2. Mood & Atmosphere Relevance (Level 3 Signal)
    if (selectedMood) {
      const moodKeywords = selectedMood
        .replace(/&/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      let moodHits = 0;
      for (const kw of moodKeywords) {
        if (reviewText.includes(kw)) {
          score += 15;
          moodHits++;
        }
        if (reviewTags.some((rt) => rt.includes(kw))) {
          score += 20;
          moodHits++;
        }
      }
      if (moodHits > 0) score += 10;
    }

    // 3. Reference Titles Taste Signal (Level 4 Signal)
    if (referenceQuery) {
      const refKeywords = referenceQuery
        .replace(/,/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);

      for (const kw of refKeywords) {
        if (reviewText.includes(kw)) {
          score += 10;
        }
      }
    }

    // 4. Calibrated Abstract Score Editorial Quality Boost
    const normScore = normalizeScore(review.abstractScore);
    if (normScore === 10) score += 20;
    else if (normScore === 9) score += 15;
    else if (normScore === 8) score += 10;
    else if (normScore >= 7) score += 5;

    let editorialReason = review.myTake || review.verdictText || 'Outstanding artistic vision worth experiencing.';
    if (editorialReason.length > 140) {
      editorialReason = editorialReason.slice(0, 137) + '...';
    }

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

  // Sort by match score descending
  scoredReviews.sort((a, b) => b.matchScore - a.matchScore);

  // --------------------------------------------------------------------------
  // STEP 3: FALLBACK WITHIN ELIGIBLE MEDIA TYPE ONLY
  // --------------------------------------------------------------------------
  // If no scored matches, fallback strictly selects within eligibleReviews
  const topReviews = scoredReviews.length > 0
    ? scoredReviews.slice(0, 6)
    : eligibleReviews.slice(0, 4).map((r) => ({
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
        editorialReason: r.myTake || r.verdictText || 'Exceptional cinematic caliber in our archive.',
        genres: r.genres || [],
        matchScore: 10,
      }));

  // Double validation: Ensure ZERO non-matching media types ever leak
  const strictlyValidatedReviews = topReviews.filter((r) => isMediaTypeMatch(r.type, targetType));

  // --------------------------------------------------------------------------
  // STEP 4: CURATED COLLECTIONS MATCHING
  // --------------------------------------------------------------------------
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
    if (targetType !== 'any' && listText.includes(targetType)) {
      listScore += 15;
    }

    if (listScore > 0 || allLists.length <= 3) {
      matchedLists.push(list);
    }
  }

  // --------------------------------------------------------------------------
  // STEP 5: DYNAMIC HEADLINE & CONTEXT NOTE
  // --------------------------------------------------------------------------
  const typeDisplay = getDisplayMediaType(targetType);
  const typePlural = targetType === 'any' ? 'Takes' : `${typeDisplay}s`;
  const genreLabel = selectedGenres.length > 0 ? selectedGenres.join(' & ') : '';

  let headline = 'What Should I Watch Next?';
  if (genreLabel && selectedMood) {
    headline = `${selectedMood.split('&')[0].trim()} ${genreLabel} ${typePlural} Worth Watching`;
  } else if (genreLabel) {
    headline = `${genreLabel} ${typePlural} Worth Watching`;
  } else if (selectedMood) {
    headline = `${criteria.mood} ${typePlural} You Should Experience`;
  } else if (targetType !== 'any') {
    headline = `Recommended ${typePlural} on The Abstract Take`;
  }

  let contextNote = 'Handpicked by The Abstract Take based on artistic caliber and storytelling rigor.';
  if (selectedMood && genreLabel) {
    contextNote = `Based on your preference for ${selectedMood.toLowerCase()} ${genreLabel.toLowerCase()}, here are the ${typePlural.toLowerCase()} The Abstract Take believes are truly worth your time.`;
  } else if (selectedMood) {
    contextNote = `Curated for a ${selectedMood.toLowerCase()} viewing experience, scored strictly on our signature 1–10 Abstract Scale.`;
  } else if (genreLabel) {
    contextNote = `The definitive ${genreLabel.toLowerCase()} selections from our editorial critique archives.`;
  } else if (targetType !== 'any') {
    contextNote = `Essential ${typePlural.toLowerCase()} scored on our official 1–10 Abstract Scale.`;
  }

  return {
    headline,
    contextNote,
    reviewedMatches: strictlyValidatedReviews,
    collectionMatches: matchedLists.slice(0, 3),
    criteria,
    canonicalType: targetType,
  };
}
