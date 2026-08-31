import { db } from '@/lib/db';
import type { Review, RecommendationList } from '@/types';
import { normalizeScore } from '@/lib/utils/rating';
import {
  normalizeMediaType,
  isMediaTypeMatch,
  getDisplayMediaType,
  CanonicalMediaType,
} from '@/lib/utils/mediaType';
import {
  resolveCanonicalMoods,
  resolveCanonicalGenres,
  TaxonomyMood,
  TaxonomyGenre,
} from './recommendationTaxonomy';
import {
  buildRecommendationProfile,
  generateExplainabilityReason,
  RecommendationReason,
  RecommendationProfile,
} from './recommendationProfile';

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
  profile: RecommendationProfile;
  reason: RecommendationReason;
  isExactMatch: boolean;
}

export interface RecommendationEngineResult {
  headline: string;
  contextNote: string;
  reviewedMatches: MatchedReviewPick[];
  collectionMatches: RecommendationList[];
  criteria: DiscoveryCriteria;
  canonicalType: CanonicalMediaType;
  hasExactMatches: boolean;
  tasteSummary: {
    mediaTypeLabel: string;
    genresLabel: string;
    moodLabel: string;
    referenceLabel?: string;
  };
}

/**
 * Advanced Recommendation Engine for The Abstract Take (Phase 5.2)
 * Combines hard media filtering, taxonomy-backed genre/mood scoring, and transparent explainability reasons.
 */
export async function matchReviewsByCriteria(
  criteria: DiscoveryCriteria
): Promise<RecommendationEngineResult> {
  const allReviews = await db.getReviews();
  const allLists = await db.getRecommendationLists();

  const targetType = normalizeMediaType(criteria.mediaType);
  const selectedGenres = criteria.genres && criteria.genres.length > 0
    ? criteria.genres
    : criteria.genre
    ? [criteria.genre]
    : [];
  const canonicalGenres = resolveCanonicalGenres(selectedGenres);
  const canonicalMoods = resolveCanonicalMoods(criteria.mood);
  const referenceQuery = (criteria.favoriteFilms || '').trim().toLowerCase();

  // --------------------------------------------------------------------------
  // STEP 1: HARD FILTER BY MEDIA TYPE (Level 1 Boundary)
  // --------------------------------------------------------------------------
  const eligibleReviews = allReviews.filter((r) => {
    if (r.status && r.status !== 'published') return false;
    return isMediaTypeMatch(r.type, targetType);
  });

  // --------------------------------------------------------------------------
  // STEP 2: SCORE AND RANK WITH STRUCTURED METADATA & REASON GENERATION
  // --------------------------------------------------------------------------
  const scoredReviews: MatchedReviewPick[] = [];

  for (const review of eligibleReviews) {
    const profile = buildRecommendationProfile(review);
    let score = 0;
    let isExactMatch = false;

    // A. Genre Matching (Level 2 Strong Constraint)
    let matchedGenreCount = 0;
    for (const g of selectedGenres) {
      const gLower = g.toLowerCase();
      const hasExactGenre = profile.genres.some((pg) => pg.toLowerCase() === gLower);
      const hasPartialGenre = review.genres.some((rg) => rg.toLowerCase().includes(gLower) || gLower.includes(rg.toLowerCase()));

      if (hasExactGenre) {
        score += 60;
        matchedGenreCount++;
      } else if (hasPartialGenre) {
        score += 40;
        matchedGenreCount++;
      }
    }
    // Compounding bonus for matching multiple selected genres
    if (matchedGenreCount > 1) {
      score += matchedGenreCount * 30;
    }
    if (matchedGenreCount > 0) {
      isExactMatch = true;
    }

    // B. Mood / Atmosphere Matching (Level 3 Ranking Signal)
    let matchedMoodCount = 0;
    for (const m of canonicalMoods) {
      if (profile.moods.some((pm) => pm.toLowerCase() === m.toLowerCase())) {
        score += 25;
        matchedMoodCount++;
      }
    }
    if (matchedMoodCount > 0 && selectedGenres.length === 0) {
      isExactMatch = true;
    }

    // C. Reference Titles Affinity (Level 4 Taste Signal)
    const referenceMatches: string[] = [];
    if (referenceQuery) {
      const refKeywords = referenceQuery
        .replace(/,/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);

      const reviewText = `${review.title} ${review.director} ${profile.themes.join(' ')}`.toLowerCase();
      for (const kw of refKeywords) {
        if (reviewText.includes(kw)) {
          score += 15;
          referenceMatches.push(kw);
        }
      }
    }

    // D. Calibrated Abstract Score Editorial Quality Boost
    const normScore = normalizeScore(review.abstractScore);
    if (normScore === 10) score += 15;
    else if (normScore === 9) score += 10;
    else if (normScore === 8) score += 5;
    else if (normScore >= 7) score += 2;

    // E. Generate Structured Explainability Reason
    const reason = generateExplainabilityReason({
      review,
      profile,
      selectedGenres,
      resolvedMoods: canonicalMoods,
      referenceMatches: referenceMatches.length > 0 ? referenceMatches : undefined,
    });

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
      editorialReason: reason.editorialSummary,
      genres: review.genres || [],
      matchScore: score,
      profile,
      reason,
      isExactMatch,
    });
  }

  // Sort by match score descending
  scoredReviews.sort((a, b) => b.matchScore - a.matchScore);

  const exactMatches = scoredReviews.filter((r) => r.isExactMatch);
  const hasExactMatches = exactMatches.length > 0;

  // Primary top recommendations (strictly within requested media type)
  const topReviews = scoredReviews.length > 0
    ? scoredReviews.slice(0, 6)
    : eligibleReviews.slice(0, 4).map((r) => {
        const profile = buildRecommendationProfile(r);
        return {
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
          editorialReason: r.myTake || r.verdictText || 'Standout cinematic caliber in our critique archives.',
          genres: r.genres || [],
          matchScore: 10,
          profile,
          reason: generateExplainabilityReason({
            review: r,
            profile,
            selectedGenres: [],
            resolvedMoods: [],
          }),
          isExactMatch: false,
        };
      });

  const strictlyValidatedReviews = topReviews.filter((r) => isMediaTypeMatch(r.type, targetType));

  // --------------------------------------------------------------------------
  // STEP 3: CURATED COLLECTIONS MATCHING
  // --------------------------------------------------------------------------
  const matchedLists: RecommendationList[] = [];
  for (const list of allLists) {
    const listText = `${list.title} ${list.description} ${list.category || ''} ${list.subtitle || ''}`.toLowerCase();
    let listScore = 0;

    for (const g of selectedGenres) {
      if (listText.includes(g.toLowerCase())) listScore += 25;
    }
    for (const m of canonicalMoods) {
      if (listText.includes(m.toLowerCase())) listScore += 20;
    }
    if (targetType !== 'any' && listText.includes(targetType)) {
      listScore += 15;
    }

    if (listScore > 0 || allLists.length <= 3) {
      matchedLists.push(list);
    }
  }

  // --------------------------------------------------------------------------
  // STEP 4: DYNAMIC EDITORIAL COPY & TASTE SUMMARY
  // --------------------------------------------------------------------------
  const typeDisplay = getDisplayMediaType(targetType);
  const typePlural = targetType === 'any' ? 'Takes' : `${typeDisplay}s`;
  const genresLabel = selectedGenres.length > 0 ? selectedGenres.join(' · ') : 'All Genres';
  const moodLabel = criteria.mood || 'Any Mood';

  let headline = 'What Should I Watch Next?';
  if (selectedGenres.length > 0 && criteria.mood) {
    headline = `${criteria.mood.split('&')[0].trim()} ${selectedGenres.join(' & ')} ${typePlural} Worth Watching`;
  } else if (selectedGenres.length > 0) {
    headline = `${selectedGenres.join(' & ')} ${typePlural} Worth Watching`;
  } else if (criteria.mood) {
    headline = `${criteria.mood} ${typePlural} You Should Experience`;
  } else if (targetType !== 'any') {
    headline = `Essential ${typePlural} on The Abstract Take`;
  }

  let contextNote = 'Handpicked by The Abstract Take based on artistic caliber and storytelling rigor.';
  if (!hasExactMatches && selectedGenres.length > 0) {
    contextNote = `We haven’t reviewed an exact ${genresLabel} match yet in our ${typeDisplay} archive. Based on your taste profile, here are the closest editorial selections and related collections we believe you should explore.`;
  } else if (criteria.mood && selectedGenres.length > 0) {
    contextNote = `Based on your preference for ${criteria.mood.toLowerCase()} ${genresLabel.toLowerCase()}, here are the ${typePlural.toLowerCase()} The Abstract Take believes are truly worth your time.`;
  } else if (criteria.mood) {
    contextNote = `Curated for a ${criteria.mood.toLowerCase()} viewing experience, scored strictly on our signature 1–10 Abstract Scale.`;
  } else if (selectedGenres.length > 0) {
    contextNote = `The definitive ${genresLabel.toLowerCase()} selections from our editorial critique archives.`;
  }

  return {
    headline,
    contextNote,
    reviewedMatches: strictlyValidatedReviews,
    collectionMatches: matchedLists.slice(0, 3),
    criteria,
    canonicalType: targetType,
    hasExactMatches,
    tasteSummary: {
      mediaTypeLabel: typeDisplay,
      genresLabel,
      moodLabel,
      referenceLabel: criteria.favoriteFilms || undefined,
    },
  };
}
