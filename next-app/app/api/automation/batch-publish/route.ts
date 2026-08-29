import { NextRequest, NextResponse } from 'next/server';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { getDerivedWatchVerdict } from '@/lib/editorial/assistant';
import { validateAutomationSecret } from '@/lib/auth';
import { slugify } from '@/lib/utils/slug';
import { revalidateReviewContent } from '@/lib/cache/revalidate';
import { Review, MediaType } from '@/types';

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
    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'InvalidPayload', message: 'Expected array of rows.' }, { status: 400 });
    }

    const results = [];
    const baseUrl = getBaseUrl(req);

    for (const row of rows) {
      try {
        const cleanTitle = String(row.title || '').trim();
        if (!cleanTitle) continue;
        const cleanYear = Number(row.releaseYear || row.year) || new Date().getFullYear();
        const baseSlug = `${slugify(cleanTitle)}-${cleanYear}`;

        const existing = await reviewRepository.findReviewByAutomationKey({
          rowId: row.rowId ? String(row.rowId) : undefined,
          slug: baseSlug,
          title: cleanTitle,
          year: cleanYear,
        });

        const normScore = Math.max(1, Math.min(10, Math.round(Number(row.rating) || 8)));
        const cleanType: MediaType = (row.contentType as MediaType) || 'Movie';

        const explicitDirector = String(row.director || row.creator || '').trim();
        const explicitCast = parseList(row.cast);
        const explicitRuntime = String(row.runtime || '').trim();
        const explicitGenres = parseList(row.genres);
        const explicitSynopsis = String(row.synopsis || row.additionalNotes || '').trim();
        const explicitPoster = String(row.posterUrl || row.poster || '').trim();
        const explicitBanner = String(row.bannerUrl || row.banner || row.backdropUrl || row.backdrop || '').trim();

        const reviewId = existing ? existing.id : `review-${Date.now()}-${slugify(cleanTitle)}`;
        const finalSlug = existing ? existing.slug : baseSlug;

        const reviewToSave: Review = {
          id: reviewId,
          slug: finalSlug,
          title: cleanTitle,
          originalTitle: row.originalTitle ? String(row.originalTitle).trim() : existing?.originalTitle,
          type: cleanType,
          status: 'published',
          releaseYear: cleanYear,
          director: existing?.director || explicitDirector || 'Editorial Curator',
          cast: existing?.cast || (explicitCast.length ? explicitCast : []),
          runtime: existing?.runtime || explicitRuntime || (cleanType === 'Movie' ? '2h 00m' : '45m / ep'),
          genres: existing?.genres || (explicitGenres.length ? explicitGenres : [cleanType, 'Cinema']),
          posterUrl:
            existing?.posterUrl ||
            explicitPoster ||
            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
          bannerUrl:
            existing?.bannerUrl ||
            explicitBanner ||
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
          abstractScore: normScore,
          myTake:
            row.headline ||
            (row.rawTake ? String(row.rawTake).slice(0, 180) : `${cleanTitle} review on The Abstract Take.`),
          streamingPlatforms: existing?.streamingPlatforms || [{ name: 'Max', type: 'Subscription' }],
          pros: parseList(row.pros || row.likes),
          cons: parseList(row.cons || row.dislikes),
          verdictText: row.verdict || row.personalVerdict || `${cleanTitle} earns a ${normScore}/10.`,
          shouldYouWatch: getDerivedWatchVerdict(normScore),
          longFormReview: row.editorialReview || row.rawTake || `${cleanTitle} review.`,
          favoriteScene: existing?.favoriteScene || 'Opening sequence establishing tone.',
          favoriteQuote: existing?.favoriteQuote || '',
          publishDate: existing?.publishDate || new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          author: {
            name: 'The Abstract Take',
            title: 'Chief Cinema Critic',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          },
          category: mapCategory(cleanType),
          tags: parseList(row.tags || [cleanType, 'The Abstract Take']),
          viewsCount: existing?.viewsCount || 1,
          likesCount: existing?.likesCount || 0,
          commentsCount: existing?.commentsCount || 0,
          readingTimeMinutes: 3,
          synopsis: explicitSynopsis || existing?.synopsis || undefined,
          seo: {
            metaTitle: `${cleanTitle} (${cleanYear}) Review — The Abstract Take`,
            metaDescription: `Editorial review for ${cleanTitle}. Score: ${normScore}/10.`,
            keywords: [cleanTitle, cleanType, 'The Abstract Take'],
          },
          source: 'google_sheets_automation',
          automationRowId: row.rowId ? String(row.rowId) : undefined,
        };

        const saved = existing
          ? await reviewRepository.updateReview(reviewToSave)
          : await reviewRepository.createReview(reviewToSave);

        await revalidateReviewContent({
          slug: saved.slug,
          type: saved.type,
          genres: saved.genres,
          tags: saved.tags,
        });

        results.push({
          rowId: row.rowId,
          success: true,
          slug: saved.slug,
          publishedUrl: `${baseUrl}/reviews/${saved.slug}`,
        });
      } catch (rowErr: any) {
        results.push({
          rowId: row.rowId,
          success: false,
          error: rowErr.message,
        });
      }
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (err: any) {
    console.error('Batch publish error:', err);
    return NextResponse.json({ error: 'BatchPublishFailed', message: err.message }, { status: 500 });
  }
}
