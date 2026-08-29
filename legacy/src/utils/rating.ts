export type ScoreDescriptor =
  | 'Masterpiece'
  | 'Brilliant'
  | 'Amazing'
  | 'Good'
  | 'Decent'
  | 'Average'
  | 'Underwhelming'
  | 'Poor'
  | 'Unbearable'
  | "Shouldn't Have Been Made";

export type QualityLabel = ScoreDescriptor;

export interface RatingScaleDefinition {
  score: number;
  descriptor: ScoreDescriptor;
  meaning: string;
  color: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    accentHex: string;
  };
}

/**
 * The Abstract Take Official 1 to 10 Scale & Word Descriptor Mapping
 */
export const RATING_SCALE: RatingScaleDefinition[] = [
  {
    score: 10,
    descriptor: 'Masterpiece',
    meaning: 'Exceptional. Almost nothing to fault.',
    color: {
      bg: 'bg-[#008CFF]',
      text: 'text-white',
      border: 'border-[#0073E6]',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-[#008CFF]',
      accentHex: '#008CFF',
    },
  },
  {
    score: 9,
    descriptor: 'Brilliant',
    meaning: 'Outstanding and highly memorable.',
    color: {
      bg: 'bg-[#15803D]',
      text: 'text-white',
      border: 'border-[#166534]',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      accentHex: '#15803D',
    },
  },
  {
    score: 8,
    descriptor: 'Amazing',
    meaning: 'Excellent; strongly worth experiencing.',
    color: {
      bg: 'bg-[#0284C7]',
      text: 'text-white',
      border: 'border-[#0369A1]',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700',
      accentHex: '#0284C7',
    },
  },
  {
    score: 7,
    descriptor: 'Good',
    meaning: 'Clearly enjoyable, with some flaws.',
    color: {
      bg: 'bg-[#4F46E5]',
      text: 'text-white',
      border: 'border-[#4338CA]',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      accentHex: '#4F46E5',
    },
  },
  {
    score: 6,
    descriptor: 'Decent',
    meaning: "Has enough going for it, but doesn't quite stand out.",
    color: {
      bg: 'bg-[#D97706]',
      text: 'text-white',
      border: 'border-[#B45309]',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      accentHex: '#D97706',
    },
  },
  {
    score: 5,
    descriptor: 'Average',
    meaning: 'Neither particularly good nor bad.',
    color: {
      bg: 'bg-[#6B7280]',
      text: 'text-white',
      border: 'border-[#4B5563]',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      accentHex: '#6B7280',
    },
  },
  {
    score: 4,
    descriptor: 'Underwhelming',
    meaning: 'More disappointing than satisfying.',
    color: {
      bg: 'bg-[#EA580C]',
      text: 'text-white',
      border: 'border-[#C2410C]',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      accentHex: '#EA580C',
    },
  },
  {
    score: 3,
    descriptor: 'Poor',
    meaning: 'Significant problems outweigh the positives.',
    color: {
      bg: 'bg-[#E11D48]',
      text: 'text-white',
      border: 'border-[#BE123C]',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      accentHex: '#E11D48',
    },
  },
  {
    score: 2,
    descriptor: 'Unbearable',
    meaning: 'Extremely difficult to enjoy.',
    color: {
      bg: 'bg-[#DC2626]',
      text: 'text-white',
      border: 'border-[#991B1B]',
      badgeBg: 'bg-red-50',
      badgeText: 'text-red-700',
      accentHex: '#DC2626',
    },
  },
  {
    score: 1,
    descriptor: "Shouldn't Have Been Made",
    meaning: 'Fundamentally fails at what it tries to do.',
    color: {
      bg: 'bg-[#881337]',
      text: 'text-white',
      border: 'border-[#4C0519]',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-900',
      accentHex: '#881337',
    },
  },
];

export const RATING_SCALE_MAP: Record<number, RatingScaleDefinition> = RATING_SCALE.reduce(
  (acc, item) => {
    acc[item.score] = item;
    return acc;
  },
  {} as Record<number, RatingScaleDefinition>
);

/**
 * Normalizes any score value to the standard 1–10 integer scale.
 */
export function normalizeScore(score: number): number {
  if (score === undefined || score === null || isNaN(score)) return 8;
  // If provided on a legacy 0-100 scale, convert to 1-10
  if (score > 10) {
    return Math.max(1, Math.min(10, Math.round(score / 10)));
  }
  return Math.max(1, Math.min(10, Math.round(score)));
}

export const normalizeRating = normalizeScore;

/**
 * Returns the exact editorial word descriptor for a 1-10 Abstract Score
 */
export function getQualityLabel(score: number): ScoreDescriptor {
  const s = normalizeScore(score);
  return RATING_SCALE_MAP[s]?.descriptor || 'Good';
}

export function getScoreDescriptor(score: number): ScoreDescriptor {
  return getQualityLabel(score);
}

/**
 * Returns the editorial meaning sentence for a 1-10 Abstract Score
 */
export function getScoreMeaning(score: number): string {
  const s = normalizeScore(score);
  return RATING_SCALE_MAP[s]?.meaning || 'Clearly enjoyable, with some flaws.';
}

export function getRatingText(score: number): string {
  const s = normalizeScore(score);
  const label = getQualityLabel(s);
  return `${s}/10 · ${label.toUpperCase()}`;
}

export function getRatingWord(score: number): string {
  return getQualityLabel(score);
}

export function getRatingColorClasses(score: number): {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  badgeText: string;
} {
  const s = normalizeScore(score);
  const def = RATING_SCALE_MAP[s] || RATING_SCALE_MAP[7];
  return {
    bg: def.color.bg,
    text: def.color.text,
    border: def.color.border,
    badgeBg: def.color.badgeBg,
    badgeText: def.color.badgeText,
  };
}

export const RATING_WORDS: Record<number, string> = {
  10: 'Masterpiece',
  9: 'Brilliant',
  8: 'Amazing',
  7: 'Good',
  6: 'Decent',
  5: 'Average',
  4: 'Underwhelming',
  3: 'Poor',
  2: 'Unbearable',
  1: "Shouldn't Have Been Made",
};

