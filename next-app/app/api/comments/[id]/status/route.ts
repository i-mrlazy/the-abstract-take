import { NextRequest, NextResponse } from 'next/server';
import { commentRepository } from '@/lib/db/repositories/commentRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

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
    const { status } = await req.json();

    if (!['approved', 'pending', 'hidden'].includes(status)) {
      return NextResponse.json({ error: 'InvalidStatus', message: 'Status must be approved, pending, or hidden.' }, { status: 400 });
    }

    const updated = await commentRepository.updateStatus(id, status);
    return NextResponse.json({ success: updated });
  } catch (err: any) {
    console.error('Update comment status error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
