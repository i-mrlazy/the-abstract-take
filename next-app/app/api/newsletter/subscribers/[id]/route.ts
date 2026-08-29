import { NextRequest, NextResponse } from 'next/server';
import { subscriberRepository } from '@/lib/db/repositories/subscriberRepository';
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
    await subscriberRepository.removeSubscriber(id);
    return NextResponse.json({ success: true, message: 'Subscriber removed' });
  } catch (err: any) {
    console.error('Remove subscriber error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
