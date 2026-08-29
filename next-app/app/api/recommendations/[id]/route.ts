import { NextRequest, NextResponse } from 'next/server';
import { recommendationRepository } from '@/lib/db/repositories/recommendationRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

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
    await recommendationRepository.deleteList(id);
    return NextResponse.json({ success: true, message: 'Recommendation list deleted' });
  } catch (err: any) {
    console.error('Delete recommendation error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
