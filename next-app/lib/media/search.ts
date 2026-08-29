import { MediaSearchResult } from '../../types';
import {
  searchMediaWithProviders,
  getProviderStatus,
  ProviderSearchResult,
  ProviderStatusSummary,
} from './providers';

export { getProviderStatus };
export type { ProviderSearchResult, ProviderStatusSummary };

/**
 * Searches media metadata through the registered provider hierarchy:
 * 1. TMDB (if explicitly configured & enabled)
 * 2. Gemini AI Metadata Suggestion (if configured)
 * 3. First-party manual fallback structure
 *
 * Guaranteed to never throw fatal runtime errors or block publishing when TMDB is unavailable.
 */
export async function searchMediaMetadata(
  query: string,
  type?: string
): Promise<MediaSearchResult[]> {
  const { results } = await searchMediaWithProviders(query, type);
  return results;
}

/**
 * Extended search returning both results and the provider that serviced the request.
 */
export async function searchMediaDetailed(
  query: string,
  type?: string
): Promise<{ results: ProviderSearchResult[]; provider: string; status: ProviderStatusSummary }> {
  const status = getProviderStatus();
  const { results, provider } = await searchMediaWithProviders(query, type);
  return { results, provider, status };
}
