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

    // Metadata enrichment
    let director = 'Editorial Curator';
    let cast: string[] = [];
    let runtime = cleanType === 'Movie' ? '2h 00m' : '45m / ep';
    let genres = [cleanType, 'Cinema'];
    let synopsis = additionalNotes || `Editorial feature critique of ${cleanTitle}.`;
    let posterUrl = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop';
    let bannerUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop';

    if (existing) {
      director = existing.director || director;
      cast = existing.cast || cast;
      runtime = existing.runtime || runtime;
      genres = existing.genres || genres;
      synopsis = existing.synopsis || synopsis;
      posterUrl = existing.posterUrl || posterUrl;
      bannerUrl = existing.bannerUrl || bannerUrl;
    } else {
      try {
        const mediaResults = await searchMediaMetadata(cleanTitle, cleanType);
        if (mediaResults.length > 0) {
          const match = mediaResults[0];
          if (match.director) director = match.director;
          if (match.cast?.length) cast = match.cast;
          if (match.runtime) runtime = match.runtime;
          if (match.genres?.length) genres = match.genres;
          if (match.synopsis) synopsis = match.synopsis;
          if (match.posterUrl) posterUrl = match.posterUrl;
          if (match.bannerUrl) bannerUrl = match.bannerUrl;
        }
      } catch (mediaErr) {
        console.warn('Media enrichment non-blocking warning:', mediaErr);
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
      type: cleanType,
      status: 'published',
      releaseYear: cleanYear,
      director,
      cast,
      runtime,
      genres,
      posterUrl,
      bannerUrl,
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
