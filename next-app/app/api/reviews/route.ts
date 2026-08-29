import { NextRequest, NextResponse } from 'next/server';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { validateReviewInput } from '@/lib/utils/validation';
import { revalidateReviewContent } from '@/lib/cache/revalidate';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  const statusParam = req.nextUrl.searchParams.get('status');
  const includeDrafts = Boolean(admin && statusParam === 'all');

  const reviews = await reviewRepository.getAll(includeDrafts);
  return NextResponse.json({
    success: true,
    reviews,
    count: reviews.length,
  });
}

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const reviewData = await req.json();
    const validation = validateReviewInput(reviewData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'ValidationError', message: validation.errors[0]?.message, errors: validation.errors },
        { status: 400 }
      );
    }

    const created = await reviewRepository.createReview(reviewData);

    // If published, trigger cache revalidation
    if (created.status === 'published') {
      await revalidateReviewContent({
        slug: created.slug,
        type: created.type,
        genres: created.genres,
        tags: created.tags,
      });
    }

    return NextResponse.json({ success: true, review: created }, { status: 201 });
  } catch (err: any) {
    console.error('Create review error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
