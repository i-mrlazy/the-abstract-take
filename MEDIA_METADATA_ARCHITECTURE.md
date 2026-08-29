# 🎬 The Abstract Take — Media Metadata Architecture

This document describes the architectural design for media metadata ingestion, storage, and publishing across **The Abstract Take**.

---

## 1. Executive Summary & Commercial Independence

*The Abstract Take* is designed to operate as an independent, commercial, revenue-generating film & television editorial publication.

To maintain commercial viability during the lean bootstrap stage without incurring high-cost commercial external API licenses, **the platform operates completely independently of TMDB (The Movie Database) or any other paid third-party metadata subscription.**

### Minimum Production Infrastructure Required
The website and CMS run with zero external metadata dependencies, requiring only:
- **Vercel** (Serverless hosting, ISR, Edge routing)
- **Supabase PostgreSQL** (Authoritative database and media metadata storage)
- **Cloudinary** (First-party poster and backdrop image CDN storage)
- **Google Gemini 2.5 Flash** (Optional editorial drafting & metadata suggestion assistant)
- **Google Sheets & Apps Script** (Bulk backlog editorial automation)

---

## 2. Core Architectural Principles

1. **First-Party Supabase Database is Authoritative**:
   All media metadata (titles, years, runtimes, cast, directors, genres, synopses, posters, backdrops, verdicts, and scores) is stored and queried directly from Supabase PostgreSQL (`reviews` table).

2. **Primary Workflow: Direct Manual Entry (Option A)**:
   The CMS Review Editor allows full manual creation and editing of every single metadata attribute without requiring any search or external lookup step.

3. **Optional AI Assistance (Option B)**:
   Google Gemini 2.5 Flash can assist the creator by proposing metadata suggestions, formatting notes, and drafting pros/cons. However:
   - Gemini is **not** treated as an authoritative factual database.
   - The creator remains responsible for reviewing and confirming all suggestions.
   - AI suggestions **never** silently overwrite existing creator input.

4. **Decoupled Provider Abstraction (`lib/media/providers/`)**:
   External metadata providers are cleanly abstracted behind the `MediaMetadataProvider` interface. TMDB is isolated in its own provider module, which is disabled by default and gracefully bypassable.

5. **Cloudinary First-Party Image Workflow**:
   Posters and widescreen backdrops uploaded by the creator are stored in Cloudinary via `/api/upload`. Existing external image URLs already stored in the database remain preserved and operational.

---

## 3. Media Metadata Schema

A review is fully publishable with first-party data stored in Supabase using the following schema:

### Required Fields (Minimum Publishing Contract)
- `title` (Official Release Title)
- `releaseYear` (Release Year as integer)
- `type` (`Movie` | `Series` | `Mini Series` | `Anime` | `Documentary` | `Special`)
- `abstractScore` (Authoritative 1 to 10 integer rating)
- `myTake` (Creator thesis hook / 1-2 sentence core verdict)
- `longFormReview` (Full editorial analysis / critique)
- `verdictText` (Closing verdict statement)
- `slug` (Unique canonical URL slug, e.g. `past-lives-2023`)

### Optional Metadata Attributes
- `originalTitle` (Original language title for foreign films / anime)
- `director` (Director, Creator, or Showrunner)
- `cast` (List of leading cast members)
- `runtime` (Duration string, e.g. `2h 15m` or `8 eps (~50m)`)
- `genres` (Array of genre tags)
- `synopsis` (Neutral plot premise overview)
- `posterUrl` (Portrait artwork URL — Cloudinary or direct image)
- `bannerUrl` (Widescreen cinematic backdrop URL)
- `trailerUrl` (YouTube or video embed URL)
- `language` (Spoken language, e.g. `Korean`, `English`)
- `country` (Country of origin, e.g. `South Korea`, `USA`)
- `streamingPlatforms` (Array of streaming service names and availability types)
- `pros` & `cons` (Key highlights and critique points)
- `favoriteScene` & `favoriteQuote` (Editorial highlight moments)
- `tags` (Editorial taxonomy tags)
- `seo` (Meta title, meta description, keywords, OpenGraph image)

---

## 4. Provider Architecture (`next-app/lib/media/providers/`)

The provider hierarchy is implemented as follows:

```
next-app/lib/media/
├── providers/
│   ├── types.ts       <-- MediaMetadataProvider interface & ProviderStatusSummary
│   ├── tmdb.ts        <-- TMDBMetadataProvider (Disabled by default, commercial-safe)
│   ├── gemini.ts      <-- GeminiMetadataProvider (AI-assisted metadata suggestions)
│   ├── manual.ts      <-- ManualMetadataProvider (Deterministic fallback template)
│   └── index.ts       <-- Provider Registry & Priority Resolver
└── search.ts          <-- Public searchMediaMetadata & searchMediaDetailed helpers
```

### Provider Interface Contract
```typescript
export interface MediaMetadataProvider {
  readonly name: string;
  readonly displayName: string;
  isAvailable(): boolean;
  search(query: string, type?: string): Promise<ProviderSearchResult[]>;
}
```

### Execution Priority
When `searchMediaMetadata(query, type)` is executed:
1. **TMDb Provider**: Checked first. If `TMDB_API_KEY` is not configured or `ENABLE_TMDB_PROVIDER="false"`, it returns `isAvailable() = false` immediately with zero latency and zero errors.
2. **Gemini Provider**: If `GEMINI_API_KEY` is configured, queries Gemini 2.5 Flash for accurate metadata extraction with `isAiGenerated: true`.
3. **Manual Provider**: If all external services are unconfigured or offline, returns a clean deterministic first-party template.

---

## 5. Google Sheets Automation Compatibility

The Google Sheets automated publishing engine operates seamlessly without TMDB:
- **Generation Phase** (`/api/automation/generate`): Routes creator input (`TITLE`, `RATING`, `MY RAW TAKE`, `PERSONAL VERDICT`) to Gemini for editorial synthesis.
- **Publishing Phase** (`/api/automation/publish`): Ingests the review directly into Supabase.
  - If optional metadata (Director, Cast, Runtime, Poster, Banner, Synopsis) is provided in extended columns (Columns 22 to 28), it is used directly.
  - If optional metadata is missing, clean first-party fallback defaults are applied.
  - Publishing **never** fails due to missing external metadata providers.

---

## 6. Future TMDB Activation (If Ever Desired)

If a commercial TMDB API license is acquired in the future:
1. Add `TMDB_API_KEY="your-commercial-key"` to `.env`.
2. Set `ENABLE_TMDB_PROVIDER="true"` in `.env`.
3. No code modifications are needed; the provider abstraction will automatically activate TMDB.
