import { GoogleGenAI } from '@google/genai';
import { WatchVerdict } from '../../types';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (typeof window !== 'undefined') {
    throw new Error('[SECURITY FATAL] Gemini AI client must NEVER be called from browser client.');
  }

  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
      aiInstance = new GoogleGenAI({ apiKey });
    }
  }
  return aiInstance;
}

export interface EditorialDraftInput {
  title: string;
  year?: number | string;
  contentType?: string;
  rating: number;
  rawTake: string;
  likes?: string;
  dislikes?: string;
  personalVerdict?: string;
  verifiedFacts?: string;
  contextualBackground?: string;
}

export interface EditorialDraftResult {
  headline: string;
  editorialReview: string;
  longFormReview?: string;
  myTakeHook: string;
  thesis?: string;
  pros: string[];
  cons: string[];
  verdictText: string;
  shouldYouWatch: WatchVerdict;
  spoilerFreeTake?: string;
  abstractScore?: number;
  favoriteQuote?: string;
  favoriteScene?: string;
  generationSource: 'gemini' | 'fallback';
  generationNote?: string;
}

const RATING_WORDS: Record<number, string> = {
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

export function getDerivedWatchVerdict(rating: number): WatchVerdict {
  if (rating >= 8) return 'Must Watch';
  if (rating >= 6) return 'Recommended';
  if (rating >= 4) return 'For Fans';
  return 'Skip';
}

export function generateOfflineEditorialDraft(input: EditorialDraftInput, fallbackReason?: string): EditorialDraftResult {
  const normScore = Math.max(1, Math.min(10, Math.round(Number(input.rating) || 8)));
  const descriptor = RATING_WORDS[normScore] || 'Good';
  const verdict = getDerivedWatchVerdict(normScore);

  const raw = (input.rawTake || '').trim();
  const likesStr = (input.likes || '').trim();
  const dislikesStr = (input.dislikes || '').trim();
  const personalVerdictStr = (input.personalVerdict || '').trim();
  const factsStr = (input.verifiedFacts || '').trim();

  // Parse list items
  const pros = likesStr
    ? likesStr.split(/[\n,;]+/).map((s) => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean)
    : ['Strong visual craft and aesthetic execution', 'Engaging thematic focus'];

  const cons = dislikesStr
    ? dislikesStr.split(/[\n,;]+/).map((s) => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean)
    : normScore >= 9
    ? []
    : ['Minor pacing inconsistencies in the midsection'];

  const headline = `${input.title}: A ${descriptor} ${input.contentType || 'Cinema'} Experience`;

  const myTakeHook = raw
    ? raw.split(/[.!?]/)[0] + '.'
    : `${input.title} stands out with deliberate stylistic conviction, earning a ${normScore}/10 (${descriptor}) on The Abstract Take scale.`;

  const paragraph1 = raw
    ? `${raw} Scoring ${normScore}/10 (${descriptor}), this ${input.contentType?.toLowerCase() || 'film'} establishes its artistic identity with clarity from the very opening frames.`
    : `${input.title} is an ambitious piece of storytelling that commands attention. Earning an authoritative ${normScore}/10 (${descriptor}) on The Abstract Take scale, it approaches its narrative with distinctive artistic intent.`;

  const paragraph2 = likesStr || factsStr
    ? `What works notably well here is ${likesStr ? `the execution of ${likesStr}` : 'the precision in craftsmanship'}.${factsStr ? ` Grounded in ${factsStr}, the production demonstrates sharp intentionality.` : ''} The tonal balance holds steady, prioritizing organic character rhythm over standard narrative shortcuts.`
    : `The craftsmanship throughout is deliberate. The pacing allows crucial narrative beats to breathe without sacrificing momentum, keeping the central conflict sharply defined.`;

  const paragraph3 = dislikesStr || personalVerdictStr
    ? `${dislikesStr ? `On the other hand, ${dislikesStr}. ` : ''}${personalVerdictStr || `Ultimately, ${input.title} delivers a resonant experience that aligns with our ${descriptor.toLowerCase()} verdict.`}`
    : personalVerdictStr || `In the final assessment, ${input.title} leaves a lasting impression that validates its standing as an essential watch.`;

  const editorialReview = `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;

  return {
    headline,
    editorialReview,
    longFormReview: editorialReview,
    myTakeHook,
    thesis: myTakeHook,
    pros: pros.slice(0, 4),
    cons: cons.slice(0, 3),
    verdictText: personalVerdictStr || `${input.title} earns an official ${normScore}/10 (${descriptor}) on The Abstract Take.`,
    shouldYouWatch: verdict,
    spoilerFreeTake: personalVerdictStr || `A rewarding ${descriptor.toLowerCase()} watch with distinct creative voice.`,
    abstractScore: normScore,
    generationSource: 'fallback',
    generationNote: fallbackReason || 'Deterministic editorial template used (Gemini AI offline/unconfigured)',
  };
}

export async function processEditorialDraft(input: EditorialDraftInput): Promise<EditorialDraftResult> {
  const normScore = Math.max(1, Math.min(10, Math.round(Number(input.rating) || 8)));
  const ratingDescriptor = RATING_WORDS[normScore] || 'Good';
  const ai = getGeminiClient();

  if (!ai) {
    return generateOfflineEditorialDraft(input, 'Gemini API key not configured');
  }

  const prompt = `You are the editorial writing assistant for The Abstract Take.

Your job is NOT to create an independent opinion.
Your job is to transform the creator's genuine opinion, notes and rating into a polished entertainment review.

EDITORIAL HIERARCHY:
1. CREATOR OPINION — highest authority.
2. VERIFIED FACTUAL INFORMATION.
3. CONTEXTUAL RESEARCH — background only.

Never allow general internet consensus to override the creator's rating, verdict or stated opinion.
Never present an AI-generated assumption, interpretation or internet opinion as the creator's personal experience.
The creator's rating is authoritative.

INPUT:
TITLE: ${input.title || 'Untitled Project'}
YEAR: ${input.year || 'N/A'}
CONTENT TYPE: ${input.contentType || 'Movie'}
RATING: ${normScore}/10 (${ratingDescriptor})
CREATOR RAW TAKE: ${input.rawTake || 'None provided'}
THINGS LIKED: ${input.likes || 'None provided'}
THINGS DISLIKED: ${input.dislikes || 'None provided'}
PERSONAL VERDICT: ${input.personalVerdict || 'None provided'}
VERIFIED FACTS: ${input.verifiedFacts || 'None provided'}
CONTEXTUAL BACKGROUND: ${input.contextualBackground || 'None provided'}

TASK:
Write approximately 250–300 words.
The review must:
- Reflect the creator's rating.
- Preserve the creator's opinion.
- Use the creator's specific points.
- Be natural and conversational.
- Be intelligent without sounding academic.
- Be specific rather than generic.
- Avoid SEO language.
- Avoid plot summary unless required for context.
- Avoid clichés.

Return ONLY valid structured JSON matching this schema:
{
  "headline": "A sharp, compelling 5-8 word editorial headline capturing the take",
  "editorialReview": "The polished 250–300 word review body written strictly adhering to the creator's raw notes, likes, dislikes, and specific observations.",
  "myTakeHook": "A punchy 1-2 sentence core thesis summarizing the creator's primary impression for the 'My Take' badge.",
  "pros": [
    "Specific strength directly from creator's likes",
    "Another specific strength"
  ],
  "cons": [
    "Specific flaw or limitation directly from creator's dislikes"
  ],
  "verdictText": "The personal verdict sentence preserving the creator's final judgment.",
  "shouldYouWatch": "${getDerivedWatchVerdict(normScore)}",
  "spoilerFreeTake": "A concise 1-2 sentence spoiler-free takeaway for casual readers."
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
      return generateOfflineEditorialDraft(input, 'Gemini returned non-JSON output');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      headline: parsed.headline || `${input.title} Review`,
      editorialReview: parsed.editorialReview || '',
      longFormReview: parsed.editorialReview || '',
      myTakeHook: parsed.myTakeHook || parsed.thesis || '',
      thesis: parsed.myTakeHook || parsed.thesis || '',
      pros: Array.isArray(parsed.pros) ? parsed.pros : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons : [],
      verdictText: parsed.verdictText || input.personalVerdict || '',
      shouldYouWatch: parsed.shouldYouWatch || getDerivedWatchVerdict(normScore),
      spoilerFreeTake: parsed.spoilerFreeTake || '',
      abstractScore: normScore,
      generationSource: 'gemini',
      generationNote: 'Generated via Gemini 2.5 Flash Editorial Assistant',
    };
  } catch (err: any) {
    console.error('Gemini Editorial Assistant error, falling back to offline generator:', err);
    return generateOfflineEditorialDraft(input, `Gemini API error: ${err.message || 'Unknown error'}`);
  }
}
