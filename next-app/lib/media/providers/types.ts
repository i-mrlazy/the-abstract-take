import { MediaSearchResult, MediaType } from '@/types';

export interface ProviderSearchResult extends MediaSearchResult {
  providerName?: 'tmdb' | 'gemini' | 'manual' | string;
  isAiGenerated?: boolean;
}

export interface MediaMetadataProvider {
  /** Unique name identifier for the provider */
  readonly name: string;

  /** Human-readable display label for admin UI */
  readonly displayName: string;

  /** Returns true if this provider is configured and available */
  isAvailable(): boolean;

  /** Search for metadata matches */
  search(query: string, type?: string): Promise<ProviderSearchResult[]>;
}

export interface ProviderStatusSummary {
  activeProvider: string;
  tmdb: {
    configured: boolean;
    enabled: boolean;
    status: 'enabled' | 'disabled' | 'unconfigured';
  };
  gemini: {
    configured: boolean;
    status: 'available' | 'unconfigured';
  };
  manual: {
    available: boolean;
  };
}
