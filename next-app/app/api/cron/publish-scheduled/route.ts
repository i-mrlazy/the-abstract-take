import { NextRequest, NextResponse } from 'next/server';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { revalidateReviewContent } from '@/lib/cache/revalidate';

export async function GET(req: NextRequest) {
  return handleScheduledPublishing(req);
}

export async function POST(req: NextRequest) {
  return handleScheduledPublishing(req);
}

async function handleScheduledPublishing(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || process.env.AUTOMATION_SECRET || 'the_abstract_take_cron_secret';
  const authHeader = req.headers.get('authorization');
  const querySecret = req.nextUrl.searchParams.get('secret');

  let providedSecret = querySecret;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedSecret = authHeader.replace('Bearer ', '').trim();
  }

  // Allow standard Vercel Cron header or explicit secret
  const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron');
  const isAuthorized = isVercelCron || (providedSecret && providedSecret === cronSecret);

  if (!isAuthorized && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing cron authorization secret.' },
      { status: 401 }
    );
  }

  try {
    const allReviews = await reviewRepository.getAll(true);
    const now = new Date();
    const nowIsoDate = now.toISOString().split('T')[0];

    const scheduledToPublish = allReviews.filter((r) => {
      if (r.status !== 'scheduled') return false;
      const targetDateStr = r.scheduledDate || r.publishDate;
      if (!targetDateStr) return false;

      const targetTimestamp = Date.parse(targetDateStr);
      if (isNaN(targetTimestamp)) {
        return targetDateStr <= nowIsoDate;
      }
      return targetTimestamp <= now.getTime();
    });

    const publishedReviews: Array<{ id: string; slug: string; title: string }> = [];

    for (const review of scheduledToPublish) {
      review.status = 'published';
      review.publishDate = review.publishDate || nowIsoDate;
      review.updatedDate = nowIsoDate;

      const saved = await reviewRepository.updateReview(review);
      await revalidateReviewContent({
        slug: saved.slug,
        type: saved.type,
        genres: saved.genres,
        tags: saved.tags,
      });

      publishedReviews.push({
        id: saved.id,
        slug: saved.slug,
        title: saved.title,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      evaluatedCount: allReviews.length,
      publishedCount: publishedReviews.length,
      published: publishedReviews,
    });
  } catch (err: any) {
    console.error('[CRON ERROR] Scheduled publishing failed:', err);
    return NextResponse.json(
      {
        error: 'CronExecutionFailed',
        message: err.message || 'Failed to execute scheduled publishing.',
      },
      { status: 500 }
    );
  }
}
