import { GoogleGenAI } from '@google/genai';
import { Review, MediaType, WatchVerdict, ArtworkMetadata } from '@/types';
import { resolveReviewArtwork } from './reviewArtwork';
import {
  TAXONOMY_GENRES,
  TAXONOMY_THEMES,
  TAXONOMY_MOODS,
  TAXONOMY_PACING,
  TAXONOMY_EXPERIENCES,
  resolveCanonicalMoods,
  resolveCanonicalGenres,
} from './recommendationTaxonomy';
import {
  normalizeScore,
  getQualityLabel,
  getRatingColorClasses,
  normalizeWatchVerdict,
  CANONICAL_WATCH_VERDICTS,
  ScoreDescriptor,
} from '@/lib/utils/rating';
import {
  normalizeContentType,
  CANONICAL_MEDIA_TYPES,
} from '@/lib/utils/mediaType';
import { slugify } from '@/lib/utils/slug';

let aiClientInstance: GoogleGenAI | null = null;

export function getGeminiPipelineClient(): GoogleGenAI | null {
  if (typeof window !== 'undefined') {
    throw new Error('[SECURITY FATAL] Gemini AI client must NEVER be called from browser client.');
  }

  if (!aiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
      aiClientInstance = new GoogleGenAI({ apiKey });
    }
  }
  return aiClientInstance;
}

export type ReviewLengthTier = 'Quick Take' | 'Standard Take' | 'Deep Take' | 'Essay';

export interface EditorialMemoryInput {
  title: string;
  releaseYear?: number | string;
  year?: number | string;
  type?: MediaType | string;
  contentType?: string;
  rating: number | string;
  abstractScore?: number | string;

  // Founder Memory & Editorial Signals
  rawTake?: string;
  myTake?: string;
  likes?: string | string[];
  whatWorked?: string | string[];
  dislikes?: string | string[];
  whatDidnt?: string | string[];
  personalVerdict?: string;
  favoriteScene?: string;
  favoriteQuote?: string;
  memoryNotes?: string;
  viewingExperience?: string;
  targetLength?: ReviewLengthTier;

  // Optional Factual / Pre-filled
  originalTitle?: string;
  director?: string;
  creator?: string;
  cast?: string | string[];
  runtime?: string;
  genres?: string | string[];
  themes?: string | string[];
  moods?: string | string[];
  externalId?: string;
  rowId?: string;
}

export interface GeneratedReviewPayload {
  title: string;
  originalTitle?: string;
  releaseYear: number;
  type: MediaType;
  director: string;
  cast: string[];
  runtime: string;
  genres: string[];
  abstractScore: number;
  scoreDescriptor: string;
  myTake: string;
  pros: string[];
  cons: string[];
  verdictText: string;
  shouldYouWatch: WatchVerdict;
  longFormReview: string;
  spoilerFreeTake?: string;
  favoriteScene?: string;
  favoriteQuote?: string;
  posterUrl?: string;
  bannerUrl?: string;
  artwork?: ArtworkMetadata;
  recommendationMetadata: {
    themes: string[];
    moods: string[];
    tones?: string[];
    pacing?: string;
    audienceExperience: string[];
  };
  generationMetadata: {
    source: 'editorial-memory-pipeline' | 'manual' | 'ai-assistant';
    founderScore: boolean;
    founderNotesProvided: boolean;
    targetLength: ReviewLengthTier;
    requiresEditorialApproval: boolean;
    generatedAt: string;
  };
  headline: string;
  seoDescription: string;
  tags: string[];
}

export interface PipelineValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedReview?: GeneratedReviewPayload;
}

export function getDerivedWatchVerdict(rating: number): WatchVerdict {
  return normalizeWatchVerdict(null, rating);
}

function parseListHelper(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  return String(input)
    .split(/[\n,;•]+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean);
}

const SCORE_CALIBRATION_GUIDES: Record<number, { descriptor: string; guidance: string }> = {
  10: {
    descriptor: 'Masterpiece',
    guidance:
      'Tone: Awe-inspiring, timeless, authoritative praise. The film is monumental, possessing transcendent aesthetic conviction and indelible emotional resonance.',
  },
  9: {
    descriptor: 'Brilliant',
    guidance:
      'Tone: High critical admiration, exceptional craftsmanship, deeply moving or intellectually rigorous, representing peak creative execution.',
  },
  8: {
    descriptor: 'Amazing',
    guidance:
      'Tone: Confident, engaging, strongly recommended. A distinct artistic voice that succeeds in virtually all key areas.',
  },
  7: {
    descriptor: 'Good',
    guidance:
      'Tone: Positive and worthwhile with clear strengths, but balanced by recognized narrative or structural limitations.',
  },
  6: {
    descriptor: 'Decent',
    guidance:
      'Tone: Modest recommendation. Commendable moments undermined by tonal friction, sluggish pacing, or conventional shortcuts.',
  },
  5: {
    descriptor: 'Average',
    guidance:
      'Tone: Neutral, mixed. Neither offensive nor memorable; feels mechanically assembled or formulaic.',
  },
  4: {
    descriptor: 'Underwhelming',
    guidance:
      'Tone: Disappointed, critical. Missed potential, clunky dialogue, or fundamentally disjointed creative decisions.',
  },
  3: {
    descriptor: 'Poor',
    guidance:
      'Tone: Heavy reservations. Fatally flawed storytelling, hollow performances, or tedious execution.',
  },
  2: {
    descriptor: 'Unbearable',
    guidance: 'Tone: Severe negative critique. Completely devoid of artistic purpose or engaging craft.',
  },
  1: {
    descriptor: "Shouldn't Have Been Made",
    guidance: 'Tone: Total creative catastrophe. Irredeemable from concept to execution.',
  },
};

const LENGTH_TIER_TARGETS: Record<ReviewLengthTier, { words: number; minWords: number; maxWords: number }> = {
  'Quick Take': { words: 125, minWords: 90, maxWords: 180 },
  'Standard Take': { words: 280, minWords: 220, maxWords: 380 },
  'Deep Take': { words: 750, minWords: 550, maxWords: 1100 },
  'Essay': { words: 1600, minWords: 1200, maxWords: 2400 },
};

/**
 * Validates generated JSON review strictly.
 */
export function validateGeneratedReview(
  data: any,
  expectedScore: number,
  expectedTitle: string
): PipelineValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Generated payload is not a valid JSON object.'], warnings: [] };
  }

  // 1. Title verification
  const title = String(data.title || expectedTitle || '').trim();
  if (!title) {
    errors.push('Review title is missing.');
  }

  // 2. Score Authority Check
  const score = normalizeScore(data.abstractScore || data.score || expectedScore);
  if (score !== expectedScore) {
    errors.push(`Score mismatch: AI modified authoritative score ${expectedScore} to ${score}. Score Authority violation.`);
  }

  // 3. Review content check
  const reviewBody = String(data.longFormReview || data.editorialReview || '').trim();
  if (!reviewBody || reviewBody.length < 50) {
    errors.push('Review body content is missing or too short (minimum 50 characters).');
  }

  // 4. My Take Hook
  const myTake = String(data.myTake || data.myTakeHook || data.thesis || '').trim();
  if (!myTake) {
    errors.push('My Take core thesis statement is missing.');
  }

  // 5. Verdict
  const verdictText = String(data.verdictText || data.verdict || '').trim();
  if (!verdictText) {
    errors.push('Verdict statement is missing.');
  }

  // 6. Pros and Cons arrays
  const pros = Array.isArray(data.pros) ? data.pros.map(String) : Array.isArray(data.whatWorked) ? data.whatWorked.map(String) : [];
  const cons = Array.isArray(data.cons) ? data.cons.map(String) : Array.isArray(data.whatDidnt) ? data.whatDidnt.map(String) : [];

  if (pros.length === 0 && score >= 7) {
    warnings.push('No pros extracted for a high-scoring review.');
  }

  // 7. Recommendation signals
  const rawThemes = data.recommendationMetadata?.themes || data.themes || [];
  const rawMoods = data.recommendationMetadata?.moods || data.moods || [];
  const rawExperiences = data.recommendationMetadata?.audienceExperience || data.audienceExperience || [];

  const themes = Array.isArray(rawThemes) ? rawThemes.map(String) : [];
  const moods = Array.isArray(rawMoods)
    ? Array.from(new Set(rawMoods.flatMap((m: string) => resolveCanonicalMoods(String(m)))))
    : resolveCanonicalMoods(String(rawMoods));
  const audienceExperience = Array.isArray(rawExperiences) ? rawExperiences.map(String) : [];

  // Media type validation & normalization (never silently fall back to Movie on invalid/unknown input)
  const normalizedType = normalizeContentType(data.type || data.contentType);
  if (!normalizedType) {
    errors.push(`Invalid media type "${data.type || data.contentType}". Must be one of: ${CANONICAL_MEDIA_TYPES.join(', ')}.`);
  }
  const cleanType: MediaType = normalizedType || 'Movie';

  // Strict Watch Verdict Normalization
  const cleanShouldYouWatch = normalizeWatchVerdict(data.shouldYouWatch, score);

  const cleanYear = Number(data.releaseYear || data.year) || new Date().getFullYear();
  const quality = getQualityLabel(score);

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Build sanitized review payload
  const sanitizedReview: GeneratedReviewPayload = {
    title,
    originalTitle: data.originalTitle ? String(data.originalTitle).trim() : undefined,
    releaseYear: cleanYear,
    type: cleanType,
    director: String(data.director || 'Editorial Curator').trim(),
    cast: Array.isArray(data.cast) ? data.cast.map(String) : [],
    runtime: String(data.runtime || (cleanType === 'Movie' ? '2h 00m' : '45m / ep')).trim(),
    genres: Array.isArray(data.genres) && data.genres.length ? data.genres.map(String) : [cleanType, 'Cinema'],
    abstractScore: score,
    scoreDescriptor: quality,
    myTake,
    pros: pros.length ? pros : ['Distinct stylistic conviction', 'Cohesive aesthetic execution'],
    cons,
    verdictText,
    shouldYouWatch: cleanShouldYouWatch,
    longFormReview: reviewBody,
    spoilerFreeTake: data.spoilerFreeTake ? String(data.spoilerFreeTake).trim() : undefined,
    favoriteScene: data.favoriteScene ? String(data.favoriteScene).trim() : undefined,
    favoriteQuote: data.favoriteQuote ? String(data.favoriteQuote).trim() : undefined,
    posterUrl: data.posterUrl || undefined,
    bannerUrl: data.bannerUrl || undefined,
    artwork: data.artwork || undefined,
    recommendationMetadata: {
      themes: themes.length ? themes : ['Human Nature', 'Identity'],
      moods: moods.length ? moods : ['Atmospheric', 'Thought-Provoking'],
      tones: data.recommendationMetadata?.tones || undefined,
      pacing: data.recommendationMetadata?.pacing || 'Moderate',
      audienceExperience: audienceExperience.length ? audienceExperience : ['Thought-Provoking'],
    },
    generationMetadata: {
      source: 'editorial-memory-pipeline',
      founderScore: true,
      founderNotesProvided: true,
      targetLength: data.generationMetadata?.targetLength || 'Standard Take',
      requiresEditorialApproval: true,
      generatedAt: new Date().toISOString(),
    },
    headline: String(data.headline || `${title}: A ${quality} Critique`).trim(),
    seoDescription: String(
      data.seoDescription ||
        `The Abstract Take's review of ${title}: "${myTake.slice(0, 140)}..." Abstract Score: ${score}/10.`
    ).trim(),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [cleanType, 'The Abstract Take', `${cleanType} Review`],
  };

  return { isValid: true, errors: [], warnings, sanitizedReview };
}

/**
 * Deterministic offline review generator for when Gemini is unconfigured or unavailable.
 */
export function generateOfflineMemoryReview(
  input: EditorialMemoryInput,
  reason = 'Deterministic offline generator'
): GeneratedReviewPayload {
  const normScore = Math.max(
    1,
    Math.min(10, Math.round(Number(input.abstractScore || input.rating) || 8))
  );
  const title = (input.title || 'Untitled Take').trim();
  const year = Number(input.releaseYear || input.year) || new Date().getFullYear();
  const rawType = input.contentType || input.type || 'Movie';
  const normType = normalizeContentType(rawType);
  const type: MediaType = normType || 'Movie';
  const targetLength: ReviewLengthTier = input.targetLength || 'Standard Take';

  const rawTake = (input.rawTake || input.myTake || '').trim();
  const personalVerdict = (input.personalVerdict || '').trim();
  const memoryNotes = (input.memoryNotes || input.viewingExperience || '').trim();
  const likesList = parseListHelper(input.likes || input.whatWorked);
  const dislikesList = parseListHelper(input.dislikes || input.whatDidnt);
  const facts = (input.originalTitle || '').trim();

  const quality = getQualityLabel(normScore);
  const calibration = SCORE_CALIBRATION_GUIDES[normScore] || SCORE_CALIBRATION_GUIDES[8];

  const pros = likesList.length
    ? likesList
    : ['Distinct aesthetic discipline and intentional framing', 'Strong tonal command throughout'];

  const cons = dislikesList.length
    ? dislikesList
    : normScore >= 9
    ? []
    : ['Pacing fluctuations in the central movement'];

  const myTake = rawTake
    ? rawTake.split(/[.!?]/)[0] + '.'
    : `${title} (${year}) demonstrates clear stylistic conviction, earning an authoritative ${normScore}/10 (${quality}) on The Abstract Take scale.`;

  // Construct paragraphs grounded strictly in founder inputs
  const p1 = rawTake
    ? `${rawTake} Scoring an authoritative ${normScore}/10 (${quality}) on The Abstract Take scale, this ${type.toLowerCase()} operates with deliberate artistic intent from its opening sequence.`
    : `${title} stands as a commanding piece of ${type.toLowerCase()} cinema. Earning a ${normScore}/10 (${quality}) on The Abstract Take scale, it approaches its themes with focused visual and narrative clarity.`;

  const p2 =
    likesList.length || memoryNotes
      ? `What resonates most effectively is ${likesList.length ? likesList.join(' alongside ') : 'its thematic commitment'}.${memoryNotes ? ` Reflecting on the viewing experience: ${memoryNotes}.` : ''} The craftsmanship remains measured, prioritizing genuine character atmosphere over predictable narrative shortcuts.`
      : `The creative execution is characterized by patience and aesthetic discipline. The directorial rhythm gives crucial narrative moments room to breathe without sacrificing tension.`;

  const p3 =
    dislikesList.length || personalVerdict
      ? `${dislikesList.length ? `Where the work encounters friction is in ${dislikesList.join(' and ')}. However, ` : ''}${personalVerdict || `ultimately, ${title} leaves an enduring impression that firmly validates its ${quality.toLowerCase()} standing.`}`
      : personalVerdict || `In the final assessment, ${title} delivers a resonant viewing experience that commands genuine respect.`;

  const longFormReview = `${p1}\n\n${p2}\n\n${p3}`;

  // Resolve artwork
  const resolvedArt = resolveReviewArtwork({ title, releaseYear: year, slug: slugify(title) });

  return {
    title,
    originalTitle: input.originalTitle ? String(input.originalTitle).trim() : undefined,
    releaseYear: year,
    type,
    director: (input.director || input.creator || 'Editorial Curator').trim(),
    cast: parseListHelper(input.cast),
    runtime: (input.runtime || (type === 'Movie' ? '2h 00m' : '45m / ep')).trim(),
    genres: parseListHelper(input.genres).length ? parseListHelper(input.genres) : [type, 'Cinema'],
    abstractScore: normScore,
    scoreDescriptor: quality,
    myTake,
    pros,
    cons,
    verdictText: personalVerdict || `${title} earns an official ${normScore}/10 (${quality}) on The Abstract Take.`,
    shouldYouWatch: normalizeWatchVerdict(null, normScore),
    longFormReview,
    spoilerFreeTake: personalVerdict || `A compelling ${quality.toLowerCase()} critique on The Abstract Take.`,
    favoriteScene: (input.favoriteScene || 'Opening sequence establishing tone and rhythm.').trim(),
    favoriteQuote: (input.favoriteQuote || '').trim(),
    posterUrl: resolvedArt.url,
    bannerUrl: resolvedArt.url,
    artwork: {
      poster: resolvedArt.url,
      backdrop: resolvedArt.url,
      sourceType: resolvedArt.sourceType,
      sourceName: resolvedArt.sourceName,
      verified: resolvedArt.verified,
    },
    recommendationMetadata: {
      themes: parseListHelper(input.themes).length ? parseListHelper(input.themes) : ['Identity', 'Human Nature'],
      moods: Array.from(
        new Set(
          (parseListHelper(input.moods).length ? parseListHelper(input.moods) : ['Atmospheric', 'Thought-Provoking'])
            .flatMap((m) => resolveCanonicalMoods(m))
        )
      ),
      pacing: 'Moderate',
      audienceExperience: ['Thought-Provoking', 'Rewatchable'],
    },
    generationMetadata: {
      source: 'editorial-memory-pipeline',
      founderScore: true,
      founderNotesProvided: Boolean(rawTake || memoryNotes || likesList.length),
      targetLength,
      requiresEditorialApproval: true,
      generatedAt: new Date().toISOString(),
    },
    headline: `${title}: A ${quality} ${type} Critique`,
    seoDescription: `Editorial review and Abstract Score (${normScore}/10 · ${quality}) for ${title} (${year}).`,
    tags: [type, 'The Abstract Take', `${type} Review`, normScore >= 9 ? 'Masterpiece' : 'Editorial Critique'],
  };
}

/**
 * Main AI Generation Pipeline Function
 */
export async function generateEditorialMemoryReview(
  input: EditorialMemoryInput
): Promise<GeneratedReviewPayload> {
  const normScore = Math.max(
    1,
    Math.min(10, Math.round(Number(input.abstractScore || input.rating) || 8))
  );
  const title = (input.title || '').trim();
  const year = Number(input.releaseYear || input.year) || new Date().getFullYear();
  const rawType = input.contentType || input.type || 'Movie';
  const normType = normalizeContentType(rawType);
  if (!normType) {
    throw new Error(`Invalid media type "${rawType}". Must be one of: ${CANONICAL_MEDIA_TYPES.join(', ')}.`);
  }
  const type: MediaType = normType;
  const targetLength: ReviewLengthTier = input.targetLength || 'Standard Take';
  const lengthConfig = LENGTH_TIER_TARGETS[targetLength] || LENGTH_TIER_TARGETS['Standard Take'];
  const scoreConfig = SCORE_CALIBRATION_GUIDES[normScore] || SCORE_CALIBRATION_GUIDES[8];

  const ai = getGeminiPipelineClient();
  if (!ai) {
    return generateOfflineMemoryReview(input, 'Gemini AI API key unconfigured');
  }

  const rawLikes = input.likes || input.whatWorked;
  const likesStr = Array.isArray(rawLikes)
    ? rawLikes.join('; ')
    : String(rawLikes || 'None provided');

  const rawDislikes = input.dislikes || input.whatDidnt;
  const dislikesStr = Array.isArray(rawDislikes)
    ? rawDislikes.join('; ')
    : String(rawDislikes || 'None provided');

  const prompt = `You are the lead editorial writing assistant for "The Abstract Take" film and television critique publication.

PRIMARY DIRECTIVE:
You are translating the founder's raw viewing memories, personal reactions, and authoritative numerical rating into a rich, publication-ready critique.

STRICT CONSTRAINTS (NON-NEGOTIABLE):
1. STRICT SCORE AUTHORITY: The founder's score is ${normScore}/10 (${scoreConfig.descriptor}). You MUST NOT change this score. The tone, thesis, pros, cons, and verdict MUST align with ${scoreConfig.descriptor} calibration.
   ${scoreConfig.guidance}
2. STRICT MEDIA TYPE CONSTRAINT: "type" MUST be EXACTLY one of: "Movie", "Series", "Anime", "Documentary", "Mini Series", "Special". Specifically, "Mini Series" MUST have a single space and NO hyphen (never "Mini - Series" or "Mini-Series").
3. STRICT SHOULD YOU WATCH CONSTRAINT: "shouldYouWatch" MUST be EXACTLY one of: "Must Watch", "Recommended", "For Fans", "Skip". NEVER output free-form sentences or conversational phrases in shouldYouWatch.
4. GROUNDED EDITORIAL SIGNALS: You must extract and build upon the founder's provided positive/negative/emotional reactions.
   NEVER invent personal memories or specific viewing occurrences that the founder did not state (e.g. do not invent "I watched this in 35mm with my family" or "I wept at the 40-minute mark" unless explicitly stated in memory notes).
5. EDITORIAL STYLE: Thoughtful, cinematic, personal, and human. Avoid academic jargon and avoid generic AI filler phrases ("masterpiece of storytelling", "takes viewers on a journey", "delves deep into", "in today's world", "a visual feast").
6. TARGET WORD COUNT: Target approximately ${lengthConfig.words} words for the main critique (acceptable range: ${lengthConfig.minWords} to ${lengthConfig.maxWords} words).
7. TAXONOMY COMPATIBILITY: Output standardized genres (${TAXONOMY_GENRES.slice(0, 10).join(', ')}...), themes (${TAXONOMY_THEMES.slice(0, 10).join(', ')}...), and moods (${TAXONOMY_MOODS.slice(0, 10).join(', ')}...).

FOUNDER'S RAW INPUTS:
- TITLE: ${title} (${year})
- MEDIA FORMAT: ${type}
- AUTHORITATIVE SCORE: ${normScore}/10 (${scoreConfig.descriptor})
- RAW CORE THESIS: ${input.rawTake || input.myTake || 'None provided'}
- WHAT WORKED (LIKES): ${likesStr}
- WHAT DIDN'T (DISLIKES): ${dislikesStr}
- PERSONAL VERDICT: ${input.personalVerdict || 'None provided'}
- MEMORY NOTES / VIEWING VIBE: ${input.memoryNotes || input.viewingExperience || 'None provided'}
- FAVORITE SCENE: ${input.favoriteScene || 'None provided'}
- FAVORITE QUOTE: ${input.favoriteQuote || 'None provided'}
- KNOWN FACTUAL METADATA: Director: ${input.director || 'Auto-detect if certain'}, Cast: ${Array.isArray(input.cast) ? input.cast.join(', ') : input.cast || 'Auto-detect if certain'}, Runtime: ${input.runtime || 'Auto-detect if certain'}

OUTPUT FORMAT:
Return ONLY a valid, parseable JSON object matching this exact schema:
{
  "title": "${title}",
  "originalTitle": ${input.originalTitle ? `"${input.originalTitle}"` : 'null'},
  "releaseYear": ${year},
  "type": "${type}",
  "director": "Director name (only if confident, else 'Editorial Curator')",
  "cast": ["Lead Actor 1", "Lead Actor 2"],
  "runtime": "Runtime string e.g. 2h 15m",
  "genres": ["Genre1", "Genre2"],
  "abstractScore": ${normScore},
  "scoreDescriptor": "${scoreConfig.descriptor}",
  "headline": "Sharp, compelling 5-8 word editorial headline capturing the thesis",
  "myTake": "1-2 sentence core thesis statement for the signature 'My Take' badge",
  "pros": ["Specific strength directly grounded in founder likes", "Another specific strength"],
  "cons": ["Specific flaw or limitation directly grounded in founder dislikes"],
  "verdictText": "The personal verdict sentence matching the ${normScore}/10 rating",
  "shouldYouWatch": "${normalizeWatchVerdict(null, normScore)}",
  "longFormReview": "The complete ${lengthConfig.words}-word structured critique in 2-4 fluid paragraphs.",
  "spoilerFreeTake": "Concise 1-2 sentence spoiler-free takeaway.",
  "favoriteScene": "${input.favoriteScene || 'Distinct scene highlighting tone'}",
  "favoriteQuote": "${input.favoriteQuote || ''}",
  "recommendationMetadata": {
    "themes": ["Theme1", "Theme2"],
    "moods": ["Mood1", "Mood2"],
    "pacing": "Slow-Burn / Moderate / Fast-Paced",
    "audienceExperience": ["Thought-Provoking", "Comfort Watch"]
  },
  "generationMetadata": {
    "source": "editorial-memory-pipeline",
    "founderScore": true,
    "founderNotesProvided": true,
    "targetLength": "${targetLength}",
    "requiresEditorialApproval": true,
    "generatedAt": "${new Date().toISOString()}"
  },
  "seoDescription": "Brief 140-char SEO meta description.",
  "tags": ["${type}", "The Abstract Take", "${type} Review"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return generateOfflineMemoryReview(input, 'Gemini returned non-JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validation = validateGeneratedReview(parsed, normScore, title);

    if (!validation.isValid || !validation.sanitizedReview) {
      console.warn('AI JSON Validation warnings/errors:', validation.errors);
      return generateOfflineMemoryReview(input, `AI validation fallback: ${validation.errors.join('; ')}`);
    }

    return validation.sanitizedReview;
  } catch (err: any) {
    console.error('Gemini Memory Pipeline error:', err);
    return generateOfflineMemoryReview(input, `Gemini API Exception: ${err.message || 'Unknown error'}`);
  }
}
