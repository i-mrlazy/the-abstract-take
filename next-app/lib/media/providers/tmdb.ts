import { MediaMetadataProvider, ProviderSearchResult } from './types';

/**
 * TMDb External Metadata Provider.
 *
 * NOTE: Commercial TMDB API plan pricing is not currently viable during lean bootstrap stages.
 * This provider is OPTIONAL and disabled unless explicitly configured and enabled.
 * The core platform never fails or requires TMDB to build, run, or publish reviews.
 */
export class TMDBMetadataProvider implements MediaMetadataProvider {
  readonly name = 'tmdb';
  readonly displayName = 'The Movie Database (TMDb v3)';

  isAvailable(): boolean {
    const key = process.env.TMDB_API_KEY;
    const explicitFlag = process.env.ENABLE_TMDB_PROVIDER;

    if (!key || key === 'MY_TMDB_API_KEY' || key.trim() === '') {
      return false;
    }

    if (explicitFlag !== undefined && (explicitFlag.toLowerCase() === 'false' || explicitFlag === '0')) {
      return false;
    }

    return true;
  }

  async search(query: string, type?: string): Promise<ProviderSearchResult[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const tmdbKey = process.env.TMDB_API_KEY!;
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(tmdbKey)}&query=${encodeURIComponent(cleanQuery)}`;
      const resp = await fetch(tmdbUrl, {
        headers: { Accept: 'application/json' },
      });

      if (!resp.ok) {
        console.warn(`[TMDB Provider] API returned status ${resp.status}`);
        return [];
      }

      const data = await resp.json();
      if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
        return [];
      }

      const results: ProviderSearchResult[] = [];
      for (const item of data.results.slice(0, 5)) {
        const isMovie = item.media_type === 'movie' || (!item.media_type && item.title);
        const title = item.title || item.name || cleanQuery;
        const originalTitle = item.original_title || item.original_name;
        const releaseDate = item.release_date || item.first_air_date || '2024';
        const year = parseInt(releaseDate.split('-')[0]) || new Date().getFullYear();
        const poster = item.poster_path
          ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
          : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop';
        const backdrop = item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop';

        results.push({
          id: `tmdb-${item.id}`,
          title,
          originalTitle,
          type: isMovie ? 'Movie' : 'Series',
          releaseYear: year,
          director: 'Director info in details',
          cast: [],
          runtime: isMovie ? '2h 00m' : '45m / ep',
          genres: ['Drama', 'Cinema'],
          synopsis: item.overview || 'Editorial synopsis unavailable.',
          posterUrl: poster,
          bannerUrl: backdrop,
          language: item.original_language,
          externalId: String(item.id),
          providerName: 'tmdb',
          isAiGenerated: false,
        });
      }
      return results;
    } catch (err) {
      console.warn('[TMDB Provider] Request failed non-blockingly:', err);
      return [];
    }
  }
}
