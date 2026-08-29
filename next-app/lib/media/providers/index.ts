import { MediaMetadataProvider, ProviderSearchResult, ProviderStatusSummary } from './types';
import { TMDBMetadataProvider } from './tmdb';
import { GeminiMetadataProvider } from './gemini';
import { ManualMetadataProvider } from './manual';

export * from './types';
export * from './tmdb';
export * from './gemini';
export * from './manual';

const tmdbProvider = new TMDBMetadataProvider();
const geminiProvider = new GeminiMetadataProvider();
const manualProvider = new ManualMetadataProvider();

export function getProviderStatus(): ProviderStatusSummary {
  const tmdbKeyPresent = Boolean(
    process.env.TMDB_API_KEY &&
      process.env.TMDB_API_KEY !== 'MY_TMDB_API_KEY' &&
      process.env.TMDB_API_KEY.trim().length > 0
  );
  const tmdbAvailable = tmdbProvider.isAvailable();
  const geminiAvailable = geminiProvider.isAvailable();

  let activeProvider = 'manual';
  if (tmdbAvailable) {
    activeProvider = 'tmdb';
  } else if (geminiAvailable) {
    activeProvider = 'gemini';
  }

  return {
    activeProvider,
    tmdb: {
      configured: tmdbKeyPresent,
      enabled: tmdbAvailable,
      status: tmdbAvailable ? 'enabled' : tmdbKeyPresent ? 'disabled' : 'unconfigured',
    },
    gemini: {
      configured: geminiAvailable,
      status: geminiAvailable ? 'available' : 'unconfigured',
    },
    manual: {
      available: true,
    },
  };
}

export async function searchMediaWithProviders(
  query: string,
  type?: string
): Promise<{ results: ProviderSearchResult[]; provider: string }> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { results: [], provider: 'none' };
  }

  // 1. TMDB (only if enabled & configured)
  if (tmdbProvider.isAvailable()) {
    try {
      const tmdbResults = await tmdbProvider.search(cleanQuery, type);
      if (tmdbResults.length > 0) {
        return { results: tmdbResults, provider: 'tmdb' };
      }
    } catch (err) {
      console.warn('[Providers] TMDB search failed, falling back to Gemini:', err);
    }
  }

  // 2. Gemini AI Metadata Suggestion Engine
  if (geminiProvider.isAvailable()) {
    try {
      const geminiResults = await geminiProvider.search(cleanQuery, type);
      if (geminiResults.length > 0) {
        return { results: geminiResults, provider: 'gemini' };
      }
    } catch (err) {
      console.warn('[Providers] Gemini search failed, falling back to manual template:', err);
    }
  }

  // 3. Manual Fallback
  const manualResults = await manualProvider.search(cleanQuery, type);
  return { results: manualResults, provider: 'manual' };
}
