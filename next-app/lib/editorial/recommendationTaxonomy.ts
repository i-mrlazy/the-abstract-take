/**
 * Centralized Recommendation Taxonomy for The Abstract Take
 * Standardizes genres, themes, moods/atmospheres, pacing, and audience experiences.
 */

export const TAXONOMY_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Coming-of-Age',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Historical',
  'Horror',
  'Musical',
  'Mystery',
  'Political',
  'Psychological',
  'Romance',
  'Science Fiction',
  'Slice of Life',
  'Sports',
  'Thriller',
  'War',
  'Western',
] as const;

export type TaxonomyGenre = (typeof TAXONOMY_GENRES)[number];

export const TAXONOMY_THEMES = [
  'Artificial Intelligence',
  'Capitalism',
  'Class',
  'Coming of Age',
  'Corruption',
  'Crime',
  'Death',
  'Existentialism',
  'Faith',
  'Family',
  'Friendship',
  'Grief',
  'Human Nature',
  'Identity',
  'Isolation',
  'Justice',
  'Loneliness',
  'Loss',
  'Love',
  'Memory',
  'Mental Health',
  'Morality',
  'Obsession',
  'Politics',
  'Power',
  'Revenge',
  'Society',
  'Survival',
  'Technology',
  'War',
] as const;

export type TaxonomyTheme = (typeof TAXONOMY_THEMES)[number];

export const TAXONOMY_MOODS = [
  'Atmospheric',
  'Cerebral',
  'Comforting',
  'Contemplative',
  'Dark',
  'Dreamlike',
  'Emotional',
  'Gritty',
  'Heartbreaking',
  'Hopeful',
  'Intellectual',
  'Intense',
  'Meditative',
  'Melancholic',
  'Mind-Bending',
  'Neo-Noir',
  'Paranoid',
  'Slow-Burn',
  'Tense',
  'Unsettling',
  'Visually Stunning',
  'Warm',
] as const;

export type TaxonomyMood = (typeof TAXONOMY_MOODS)[number];

export const TAXONOMY_PACING = [
  'Very Slow',
  'Slow-Burn',
  'Measured',
  'Moderate',
  'Fast-Paced',
  'Relentless',
] as const;

export type TaxonomyPacing = (typeof TAXONOMY_PACING)[number];

export const TAXONOMY_EXPERIENCES = [
  'Comfort Watch',
  'Conversation Starter',
  'Demanding',
  'Disturbing',
  'Easy Watch',
  'Emotionally Challenging',
  'Escapist',
  'Rewatchable',
  'Thought-Provoking',
  'Visually Immersive',
] as const;

export type TaxonomyExperience = (typeof TAXONOMY_EXPERIENCES)[number];

/**
 * Mood alias dictionary for mapping composite or verbose UI labels to canonical taxonomy tags.
 */
export const MOOD_ALIAS_MAP: Record<string, TaxonomyMood[]> = {
  'deeply emotional & melancholic': ['Emotional', 'Melancholic', 'Heartbreaking'],
  'emotional & melancholic': ['Emotional', 'Melancholic', 'Heartbreaking'],
  'high paranoia & mind-bending': ['Paranoid', 'Mind-Bending', 'Cerebral'],
  'dark & gritty': ['Dark', 'Gritty', 'Intense'],
  'slow-burn & contemplative': ['Slow-Burn', 'Contemplative', 'Atmospheric', 'Meditative'],
  'visually stunning & dreamlike': ['Visually Stunning', 'Dreamlike', 'Atmospheric'],
  'warm, comforting & human': ['Warm', 'Comforting', 'Hopeful'],
  'tense, paranoid & edge-of-seat': ['Tense', 'Paranoid', 'Unsettling'],
  'cerebral & intellectual': ['Cerebral', 'Intellectual', 'Thought-Provoking' as any],
  contemplative: ['Contemplative', 'Atmospheric'],
  melancholic: ['Melancholic', 'Emotional'],
  emotional: ['Emotional'],
  dark: ['Dark', 'Gritty'],
  paranoid: ['Paranoid', 'Tense'],
  'mind-bending': ['Mind-Bending', 'Cerebral'],
  comforting: ['Comforting', 'Warm'],
  unsettling: ['Unsettling', 'Dark'],
  dreamlike: ['Dreamlike', 'Visually Stunning'],
  'neo-noir': ['Neo-Noir', 'Atmospheric', 'Dark'],
};

/**
 * Resolves any mood input string (e.g. from UI chips or query parameters) to canonical taxonomy moods.
 */
export function resolveCanonicalMoods(rawMood?: string | null): TaxonomyMood[] {
  if (!rawMood) return [];
  const normalized = rawMood.trim().toLowerCase();

  // Exact alias match
  if (MOOD_ALIAS_MAP[normalized]) {
    return MOOD_ALIAS_MAP[normalized];
  }

  // Check substring matches
  const matchedMoods = new Set<TaxonomyMood>();
  for (const [key, moods] of Object.entries(MOOD_ALIAS_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      moods.forEach((m) => matchedMoods.add(m));
    }
  }

  // Check direct taxonomy items
  for (const mood of TAXONOMY_MOODS) {
    if (normalized.includes(mood.toLowerCase())) {
      matchedMoods.add(mood);
    }
  }

  return Array.from(matchedMoods);
}

/**
 * Resolves a list of genre strings to canonical taxonomy genres.
 */
export function resolveCanonicalGenres(rawGenres: string[]): TaxonomyGenre[] {
  const result = new Set<TaxonomyGenre>();
  for (const raw of rawGenres) {
    const cleaned = raw.trim().toLowerCase();
    for (const g of TAXONOMY_GENRES) {
      if (g.toLowerCase() === cleaned || cleaned.includes(g.toLowerCase())) {
        result.add(g);
      }
    }
  }
  return Array.from(result);
}
