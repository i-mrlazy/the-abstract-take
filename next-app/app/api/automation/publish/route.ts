import { NextRequest, NextResponse } from 'next/server';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { searchMediaMetadata } from '@/lib/media/search';
import { getDerivedWatchVerdict } from '@/lib/editorial/assistant';
import { validateAutomationSecret } from '@/lib/auth';
import { slugify } from '@/lib/utils/slug';
import { revalidateReviewContent } from '@/lib/cache/revalidate';
import { Review, MediaType, ReviewSEO } from '@/types';

function parseList(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  return String(input)
    .split(/[\n,;•]+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean);
}

function mapCategory(type: MediaType): string {
  switch (type) {
    case 'Movie':
      return 'Movies';
    case 'Series':
    case 'Mini Series':
      return 'Series';
    case 'Anime':
      return 'Anime';
    case 'Documentary':
      return 'Documentaries';
    default:
      return 'Critique';
  }
}

function getBaseUrl(req: NextRequest): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.SITE_BASE_URL) {
    return process.env.SITE_BASE_URL.replace(/\/$/, '');
  }
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  if (!validateAutomationSecret(req)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing automation secret key.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      rowId,
      title,
      originalTitle,
      releaseYear,
      year,
      contentType,
      externalId,
      rating,
      rawTake,
      likes,
      dislikes,
      personalVerdict,
      additionalNotes,
      headline,
      editorialReview,
      pros,
      cons,
      verdict,
      seoDescription,
      tags,
      // Optional explicit metadata fields (from sheet extended columns or API payload)
      director: inputDirector,
      creator: inputCreator,
      cast: inputCast,
      runtime: inputRuntime,
      genres: inputGenres,
      synopsis: inputSynopsis,
      posterUrl: inputPosterUrl,
      poster: inputPoster,
      bannerUrl: inputBannerUrl,
      banner: inputBanner,
      backdropUrl: inputBackdropUrl,
      backdrop: inputBackdrop,
      trailerUrl: inputTrailerUrl,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'MissingTitle', message: 'Title is required for publishing.' }, { status: 400 });
    }

    const cleanTitle = String(title).trim();
    const cleanYear = Number(releaseYear || year) || new Date().getFullYear();
    const cleanType: MediaType = (contentType as MediaType) || 'Movie';
    const normScore = Math.max(1, Math.min(10, Math.round(Number(rating) || 8)));
    const baseSlug = `${slugify(cleanTitle)}-${cleanYear}`;

    // Idempotency: Check if this review already exists
    const existing = await reviewRepository.findReviewByAutomationKey({
      rowId: rowId ? String(rowId) : undefined,
      slug: baseSlug,
      title: cleanTitle,
      year: cleanYear,
    });

    // Determine Metadata Priority:
    // 1. Existing database record (preserve creator edits)
    // 2. Explicitly supplied fields in payload / Google Sheet
    // 3. Provider lookup (non-blocking fallback)
    // 4. Clean first-party defaults
    const explicitDirector = String(inputDirector || inputCreator || '').trim();
    const explicitCast = parseList(inputCast);
    const explicitRuntime = String(inputRuntime || '').trim();
    const explicitGenres = parseList(inputGenres);
    const explicitSynopsis = String(inputSynopsis || additionalNotes || '').trim();
    const explicitPoster = String(inputPosterUrl || inputPoster || '').trim();
    const explicitBanner = String(inputBannerUrl || inputBanner || inputBackdropUrl || inputBackdrop || '').trim();
    const explicitTrailer = String(inputTrailerUrl || '').trim();

    let director = existing?.director || explicitDirector || 'Editorial Curator';
    let cast: string[] = existing?.cast || (explicitCast.length ? explicitCast : []);
    let runtime = existing?.runtime || explicitRuntime || (cleanType === 'Movie' ? '2h 00m' : '45m / ep');
    let genres = existing?.genres || (explicitGenres.length ? explicitGenres : [cleanType, 'Cinema']);
    let synopsis = existing?.synopsis || explicitSynopsis || `Editorial feature critique of ${cleanTitle}.`;
    let posterUrl = existing?.posterUrl || explicitPoster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop';
    let bannerUrl = existing?.bannerUrl || explicitBanner || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop';
    let trailerUrl = existing?.trailerUrl || explicitTrailer || undefined;

    if (!existing && (!explicitDirector || !explicitPoster)) {
      try {
        const mediaResults = await searchMediaMetadata(cleanTitle, cleanType);
        if (mediaResults.length > 0) {
          const match = mediaResults[0];
          if (!explicitDirector && match.director) director = match.director;
          if (!explicitCast.length && match.cast?.length) cast = match.cast;
          if (!explicitRuntime && match.runtime) runtime = match.runtime;
          if (!explicitGenres.length && match.genres?.length) genres = match.genres;
          if (!explicitSynopsis && match.synopsis) synopsis = match.synopsis;
          if (!explicitPoster && match.posterUrl) posterUrl = match.posterUrl;
          if (!explicitBanner && match.bannerUrl) bannerUrl = match.bannerUrl;
          if (!explicitTrailer && match.trailerUrl) trailerUrl = match.trailerUrl;
        }
      } catch (mediaErr) {
        console.warn('Media enrichment non-blocking notice:', mediaErr);
      }
    }

    const parsedPros = parseList(pros || likes);
    const parsedCons = parseList(cons || dislikes);
    const parsedTags = parseList(tags || [cleanType, 'Auteur', 'The Abstract Take']);

    const longForm = editorialReview || rawTake || `${cleanTitle} is reviewed on The Abstract Take.`;
    const wordCount = longForm.trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(2, Math.round(wordCount / 180));
    const watchVerdict = getDerivedWatchVerdict(normScore);

    const reviewId = existing ? existing.id : `review-${Date.now()}-${slugify(cleanTitle)}`;
    const finalSlug = existing ? existing.slug : baseSlug;

    const reviewSeo: ReviewSEO = {
      metaTitle: `${cleanTitle} (${cleanYear}) Review — The Abstract Take`,
      metaDescription:
        seoDescription ||
        (rawTake
          ? `"${String(rawTake).slice(0, 140)}..." Score: ${normScore}/10.`
          : `Personal review and Abstract Score (${normScore}/10) for ${cleanTitle}.`),
      keywords: [cleanTitle, `${cleanTitle} Review`, cleanType, 'The Abstract Take', `Score ${normScore}`],
      slug: finalSlug,
      ogImage: bannerUrl || posterUrl,
    };

    const reviewToSave: Review = {
      id: reviewId,
      slug: finalSlug,
      title: cleanTitle,
      originalTitle: originalTitle ? String(originalTitle).trim() : existing?.originalTitle,
      type: cleanType,
      status: 'published',
      releaseYear: cleanYear,
      director,
      cast,
      runtime,
      genres,
      posterUrl,
      bannerUrl,
      trailerUrl,
      abstractScore: normScore,
      myTake: headline || (rawTake ? String(rawTake).slice(0, 180) : `${cleanTitle} earns a ${normScore}/10 on The Abstract Take.`),
      streamingPlatforms: existing?.streamingPlatforms || [
        { name: 'Max / VOD', type: 'Subscription' },
        { name: 'Apple TV', type: 'Rent/Buy' },
      ],
      pros: parsedPros.length ? parsedPros : ['Distinct stylistic voice', 'Focused aesthetic direction'],
      cons: parsedCons,
      verdictText: verdict || personalVerdict || `${cleanTitle} earns an authoritative ${normScore}/10 on The Abstract Take.`,
      shouldYouWatch: watchVerdict,
      longFormReview: longForm,
      spoilerFreeTake: personalVerdict || undefined,
      favoriteScene: existing?.favoriteScene || 'Opening sequence establishing tone and rhythm.',
      favoriteQuote: existing?.favoriteQuote || '',
      publishDate: existing?.publishDate || new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      author: {
        name: 'The Abstract Take',
        title: 'Chief Cinema Critic',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      },
      category: mapCategory(cleanType),
      tags: parsedTags,
      viewsCount: existing?.viewsCount || 1,
      likesCount: existing?.likesCount || 0,
      commentsCount: existing?.commentsCount || 0,
      readingTimeMinutes: readTime,
      synopsis,
      seo: reviewSeo,
      source: 'google_sheets_automation',
      automationRowId: rowId ? String(rowId) : undefined,
    };

    const savedReview = existing
      ? await reviewRepository.updateReview(reviewToSave)
      : await reviewRepository.createReview(reviewToSave);

    // Revalidate relevant cache routes
    await revalidateReviewContent({
      slug: savedReview.slug,
      type: savedReview.type,
      genres: savedReview.genres,
      tags: savedReview.tags,
    });

    const baseUrl = getBaseUrl(req);
    const publishedUrl = `${baseUrl}/reviews/${savedReview.slug}`;

    return NextResponse.json({
      success: true,
      isUpdate: Boolean(existing),
      reviewId: savedReview.id,
      slug: savedReview.slug,
      title: savedReview.title,
      publishedUrl,
      status: 'Published',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Automation Publish Error:', err);
    return NextResponse.json(
      {
        error: 'PublishFailed',
        message: err.message || 'Failed to publish review.',
      },
      { status: 500 }
    );
  }
}
