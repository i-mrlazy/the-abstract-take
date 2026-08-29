import { NextRequest, NextResponse } from 'next/server';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const duplicated = await reviewRepository.duplicateReview(id);
    if (!duplicated) {
      return NextResponse.json({ error: 'NotFound', message: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, review: duplicated }, { status: 201 });
  } catch (err: any) {
    console.error('Duplicate review error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
