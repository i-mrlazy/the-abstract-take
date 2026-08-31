import type { Review } from '@/types';
import {
  TAXONOMY_GENRES,
  TAXONOMY_THEMES,
  TAXONOMY_MOODS,
  TAXONOMY_PACING,
  TAXONOMY_EXPERIENCES,
  TaxonomyGenre,
  TaxonomyTheme,
  TaxonomyMood,
  TaxonomyPacing,
  TaxonomyExperience,
  resolveCanonicalMoods,
} from './recommendationTaxonomy';

export interface RecommendationProfile {
  genres: TaxonomyGenre[];
  themes: TaxonomyTheme[];
  moods: TaxonomyMood[];
  pacing?: TaxonomyPacing;
  experiences: TaxonomyExperience[];
}

export interface RecommendationReason {
  matchedGenres: string[];
  matchedThemes: string[];
  matchedMoods: string[];
  referenceAffinity?: string[];
  qualitySignal?: string;
  explanationBullets: string[];
  editorialSummary: string;
}

/**
 * Builds a structured RecommendationProfile for any review.
 * Prioritizes explicit metadata, structured tags/genres, then controlled thematic classification.
 */
export function buildRecommendationProfile(review: Review): RecommendationProfile {
  const meta = (review as any).recommendationMetadata || {};

  // 1. Genres extraction & normalization
  const extractedGenres = new Set<TaxonomyGenre>();
  const explicitGenres = review.genres || [];
  for (const g of explicitGenres) {
    const gLower = g.trim().toLowerCase();
    for (const taxG of TAXONOMY_GENRES) {
      if (taxG.toLowerCase() === gLower || gLower.includes(taxG.toLowerCase())) {
        extractedGenres.add(taxG);
      }
    }
  }
  if (Array.isArray(meta.genres)) {
    meta.genres.forEach((g: TaxonomyGenre) => extractedGenres.add(g));
  }

  // 2. Themes extraction & normalization
  const extractedThemes = new Set<TaxonomyTheme>();
  const explicitTags = review.tags || [];
  for (const t of explicitTags) {
    const tLower = t.trim().toLowerCase();
    for (const taxT of TAXONOMY_THEMES) {
      if (taxT.toLowerCase() === tLower || tLower.includes(taxT.toLowerCase())) {
        extractedThemes.add(taxT);
      }
    }
  }
  if (Array.isArray(meta.themes)) {
    meta.themes.forEach((th: TaxonomyTheme) => extractedThemes.add(th));
  }

  // Controlled thematic mapping from synopsis & thesis
  const fullContent = `${review.myTake || ''} ${review.verdictText || ''} ${review.synopsis || ''}`.toLowerCase();
  for (const theme of TAXONOMY_THEMES) {
    const thLower = theme.toLowerCase();
    // Use word-boundary checking
    const regex = new RegExp(`\\b${thLower}\\b`, 'i');
    if (regex.test(fullContent) && !fullContent.includes(`no ${thLower}`) && !fullContent.includes(`not a ${thLower}`)) {
      extractedThemes.add(theme);
    }
  }

  // 3. Moods extraction & normalization
  const extractedMoods = new Set<TaxonomyMood>();
  for (const t of explicitTags) {
    const resolved = resolveCanonicalMoods(t);
    resolved.forEach((m) => extractedMoods.add(m));
  }
  if (Array.isArray(meta.moods)) {
    meta.moods.forEach((m: TaxonomyMood) => extractedMoods.add(m));
  }
  for (const mood of TAXONOMY_MOODS) {
    const mLower = mood.toLowerCase();
    const regex = new RegExp(`\\b${mLower}\\b`, 'i');
    if (regex.test(fullContent) && !fullContent.includes(`not ${mLower}`)) {
      extractedMoods.add(mood);
    }
  }

  // 4. Pacing
  let pacing: TaxonomyPacing | undefined = meta.pacing;
  if (!pacing) {
    for (const p of TAXONOMY_PACING) {
      if (fullContent.includes(p.toLowerCase())) {
        pacing = p;
        break;
      }
    }
  }

  // 5. Experiences
  const extractedExperiences = new Set<TaxonomyExperience>();
  if (Array.isArray(meta.audienceExperience)) {
    meta.audienceExperience.forEach((e: TaxonomyExperience) => extractedExperiences.add(e));
  }
  for (const exp of TAXONOMY_EXPERIENCES) {
    if (fullContent.includes(exp.toLowerCase())) {
      extractedExperiences.add(exp);
    }
  }

  return {
    genres: Array.from(extractedGenres),
    themes: Array.from(extractedThemes),
    moods: Array.from(extractedMoods),
    pacing,
    experiences: Array.from(extractedExperiences),
  };
}

/**
 * Generates transparent, human-readable explainability signals for a matched recommendation.
 */
export function generateExplainabilityReason(params: {
  review: Review;
  profile: RecommendationProfile;
  selectedGenres: string[];
  resolvedMoods: TaxonomyMood[];
  referenceMatches?: string[];
}): RecommendationReason {
  const { review, profile, selectedGenres, resolvedMoods, referenceMatches } = params;

  // 1. Identify matched genres
  const matchedGenres = profile.genres.filter((g) =>
    selectedGenres.some((sg) => sg.toLowerCase() === g.toLowerCase() || g.toLowerCase().includes(sg.toLowerCase()))
  );

  // 2. Identify matched moods
  const matchedMoods = profile.moods.filter((m) =>
    resolvedMoods.some((rm) => rm.toLowerCase() === m.toLowerCase())
  );

  // 3. Matched themes
  const matchedThemes = profile.themes.slice(0, 3);

  // 4. Generate explainability bullet points
  const bullets: string[] = [];

  if (matchedGenres.length > 0) {
    bullets.push(`${matchedGenres.join(' & ')} matches your selected genre preference`);
  } else if (profile.genres.length > 0) {
    bullets.push(`Auteur ${profile.genres.slice(0, 2).join(' / ')} storytelling`);
  }

  if (matchedMoods.length > 0) {
    bullets.push(`${matchedMoods.join(' and ')} atmosphere and tone`);
  } else if (profile.moods.length > 0) {
    bullets.push(`${profile.moods.slice(0, 2).join(' & ')} aesthetic`);
  }

  if (matchedThemes.length > 0) {
    bullets.push(`Explores deep themes of ${matchedThemes.map((t) => t.toLowerCase()).join(', ')}`);
  }

  if (referenceMatches && referenceMatches.length > 0) {
    bullets.push(`Similar narrative depth to ${referenceMatches.join(', ')}`);
  }

  // Quality signal
  const score = review.abstractScore;
  let qualitySignal = '';
  if (score >= 9) {
    qualitySignal = `Rated ${score}/10 — Masterpiece caliber on the official Abstract Scale`;
  } else if (score >= 8) {
    qualitySignal = `Rated ${score}/10 — High critical caliber on the official Abstract Scale`;
  }

  const editorialSummary =
    review.myTake || review.verdictText || `A standout ${review.type} in our editorial archives.`;

  return {
    matchedGenres,
    matchedThemes,
    matchedMoods,
    referenceAffinity: referenceMatches,
    qualitySignal,
    explanationBullets: bullets.slice(0, 3),
    editorialSummary,
  };
}
