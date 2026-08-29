import { GoogleGenAI } from "@google/genai";
import { MediaSearchResult, MediaType } from "../src/types";

let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function searchMediaMetadata(query: string, type?: string): Promise<MediaSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // Try TMDB API if key provided
  const tmdbKey = process.env.TMDB_API_KEY;
  if (tmdbKey) {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(cleanQuery)}`;
      const resp = await fetch(tmdbUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (data.results && data.results.length > 0) {
          const results: MediaSearchResult[] = [];
          for (const item of data.results.slice(0, 5)) {
            const isMovie = item.media_type === "movie" || (!item.media_type && item.title);
            const title = item.title || item.name || cleanQuery;
            const originalTitle = item.original_title || item.original_name;
            const releaseDate = item.release_date || item.first_air_date || "2024";
            const year = parseInt(releaseDate.split("-")[0]) || 2024;
            const poster = item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop";
            const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop";

            results.push({
              id: `tmdb-${item.id}`,
              title,
              originalTitle,
              type: isMovie ? "Movie" : "Series",
              releaseYear: year,
              director: "Director info in details",
              cast: [],
              runtime: isMovie ? "2h 00m" : "45m / ep",
              genres: ["Drama", "Cinema"],
              synopsis: item.overview || "Editorial synopsis unavailable.",
              posterUrl: poster,
              bannerUrl: backdrop,
              language: item.original_language,
              externalId: String(item.id),
            });
          }
          if (results.length > 0) return results;
        }
      }
    } catch (err) {
      console.warn("TMDB search fallback to Gemini:", err);
    }
  }

  // Gemini Metadata Retrieval Engine
  const ai = getGemini();
  if (ai) {
    try {
      const prompt = `You are a cinema and television metadata engine for "The Abstract Take" film critique magazine.
Search and extract accurate real-world metadata for this media query: "${cleanQuery}" (preferred format/type: ${type || "any"}).

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
- posterUrl: high-quality poster image URL (use valid direct image URL or high quality cinema image)
- bannerUrl: cinematic widescreen backdrop image URL
- language: original spoken language (e.g. "English", "Japanese")
- country: country of origin (e.g. "United States", "Japan")
- trailerUrl: YouTube trailer search or URL if known
- externalId: TMDB or IMDb ID if known

Respond ONLY with valid JSON array:
[
  { ... }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize image URLs if missing
          return parsed.map((item, idx) => ({
            ...item,
            id: item.id || `meta-${Date.now()}-${idx}`,
            posterUrl: item.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
            bannerUrl: item.bannerUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
            cast: Array.isArray(item.cast) ? item.cast : [],
            genres: Array.isArray(item.genres) ? item.genres : ["Cinema"],
          }));
        }
      }
    } catch (aiErr) {
      console.error("Gemini media search error:", aiErr);
    }
  }

  // Fallback basic search result if offline
  return [
    {
      id: `meta-manual-${Date.now()}`,
      title: cleanQuery,
      originalTitle: cleanQuery,
      type: (type as MediaType) || "Movie",
      releaseYear: new Date().getFullYear(),
      director: "Director Name",
      cast: ["Lead Actor 1", "Lead Actor 2"],
      runtime: "2h 00m",
      genres: ["Drama", "Cinema"],
      synopsis: `Cinematic feature titled ${cleanQuery}.`,
      posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
      language: "English",
      country: "USA",
    },
  ];
}
