import { GoogleGenAI } from '@google/genai';
import { MediaMetadataProvider, ProviderSearchResult } from './types';

let geminiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY' && key.trim().length > 0) {
      geminiInstance = new GoogleGenAI({ apiKey: key.trim() });
    }
  }
  return geminiInstance;
}

/**
 * Gemini AI Metadata Suggestion Engine.
 *
 * NOTE: AI suggestions assist creators with metadata formatting and drafting,
 * but are not an authoritative database. The creator/editor is always responsible
 * for approving and confirming metadata before publication.
 */
export class GeminiMetadataProvider implements MediaMetadataProvider {
  readonly name = 'gemini';
  readonly displayName = 'Gemini AI Editorial Assistant';

  isAvailable(): boolean {
    return Boolean(getGeminiClient());
  }

  async search(query: string, type?: string): Promise<ProviderSearchResult[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const ai = getGeminiClient();
    if (!ai) return [];

    try {
      const prompt = `You are a cinema and television metadata engine for "The Abstract Take" film critique magazine.
Search and extract accurate real-world metadata for this media query: "${cleanQuery}" (preferred format/type: ${type || 'any'}).

Return a JSON array of up to 4 closest matching real movies, television series, anime series/films, or documentaries matching the query.
For each item, provide:
- id: unique string (e.g. "meta-dune-2")
- title: exact official release title (e.g. "Dune: Part Two")
- originalTitle: original language title if foreign or non-English (e.g. "Doraibu mai kā")
- type: one of "Movie", "Series", "Anime", "Documentary", "Mini Series", "Special"
- releaseYear: number (e.g. 2024)
- director: full name of director(s) or showrunner (e.g. "Denis Villeneuve")
- cast: array of 4-6 leading actors (e.g. ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"])
- runtime: string format (e.g. "2h 46m" or "9 Episodes (~55m each)")
- genres: array of 2-4 genre strings (e.g. ["Sci-Fi", "Adventure", "Drama"])
- synopsis: 2-3 sentence neutral plot overview (do not include spoilers or subjective reviews here)
- posterUrl: high-quality poster image URL (direct public image URL or fallback)
- bannerUrl: cinematic widescreen backdrop image URL
- language: original spoken language (e.g. "English", "Japanese")
- country: country of origin (e.g. "United States", "Japan")
- trailerUrl: YouTube trailer search or URL if known
- externalId: IMDb or Wikidata ID if known

Respond ONLY with valid JSON array:
[
  { ... }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            ...item,
            id: item.id || `ai-${Date.now()}-${idx}`,
            posterUrl:
              item.posterUrl ||
              'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
            bannerUrl:
              item.bannerUrl ||
              'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
            cast: Array.isArray(item.cast) ? item.cast : [],
            genres: Array.isArray(item.genres) ? item.genres : ['Cinema'],
            providerName: 'gemini',
            isAiGenerated: true,
          }));
        }
      }
      return [];
    } catch (err) {
      console.warn('[Gemini Provider] Search failed non-blockingly:', err);
      return [];
    }
  }
}
