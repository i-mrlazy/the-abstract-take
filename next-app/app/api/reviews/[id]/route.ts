import { NextRequest, NextResponse } from 'next/server';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { validateReviewInput } from '@/lib/utils/validation';
import { revalidateReviewContent } from '@/lib/cache/revalidate';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const review = (await reviewRepository.getById(id)) || (await reviewRepository.getBySlug(id));

  if (!review) {
    return NextResponse.json({ error: 'NotFound', message: 'Review not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, review });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const reviewData = await req.json();
    reviewData.id = id;

    const validation = validateReviewInput(reviewData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'ValidationError', message: validation.errors[0]?.message, errors: validation.errors },
        { status: 400 }
      );
    }

    const updated = await reviewRepository.updateReview(reviewData);

    // Trigger cache revalidation
    await revalidateReviewContent({
      slug: updated.slug,
      type: updated.type,
      genres: updated.genres,
      tags: updated.tags,
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (err: any) {
    console.error('Update review error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = (await reviewRepository.getById(id)) || (await reviewRepository.getBySlug(id));
    const deleted = await reviewRepository.deleteReview(id);

    if (existing) {
      await revalidateReviewContent({
        slug: existing.slug,
        type: existing.type,
        genres: existing.genres,
        tags: existing.tags,
      });
    }

    return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    console.error('Delete review error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
