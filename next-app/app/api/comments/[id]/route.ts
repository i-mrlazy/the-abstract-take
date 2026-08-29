import { NextRequest, NextResponse } from 'next/server';
import { commentRepository } from '@/lib/db/repositories/commentRepository';
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
    const deleted = await commentRepository.deleteComment(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error('Delete comment error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
