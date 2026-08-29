import { MediaType } from '@/types';
import { MediaMetadataProvider, ProviderSearchResult } from './types';

/**
 * Manual / Baseline Metadata Provider.
 * Allows pure offline / first-party metadata generation and editing.
 */
export class ManualMetadataProvider implements MediaMetadataProvider {
  readonly name = 'manual';
  readonly displayName = 'Manual First-Party Metadata';

  isAvailable(): boolean {
    return true;
  }

  async search(query: string, type?: string): Promise<ProviderSearchResult[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    return [
      {
        id: `manual-${Date.now()}`,
        title: cleanQuery,
        originalTitle: cleanQuery,
        type: (type as MediaType) || 'Movie',
        releaseYear: new Date().getFullYear(),
        director: '',
        cast: [],
        runtime: type === 'Series' || type === 'Mini Series' ? '45m / ep' : '2h 00m',
        genres: ['Cinema'],
        synopsis: `Editorial review and critical analysis of ${cleanQuery}.`,
        posterUrl:
          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
        bannerUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
        language: 'English',
        country: '',
        providerName: 'manual',
        isAiGenerated: false,
      },
    ];
  }
}
