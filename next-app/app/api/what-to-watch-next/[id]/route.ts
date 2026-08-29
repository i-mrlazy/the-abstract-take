import { NextRequest, NextResponse } from 'next/server';
import { whatNextRepository } from '@/lib/db/repositories/whatNextRepository';
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
    await whatNextRepository.deleteItem(id);
    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (err: any) {
    console.error('Delete what-to-watch error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
