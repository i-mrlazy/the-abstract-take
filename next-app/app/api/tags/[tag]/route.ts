import { NextRequest, NextResponse } from 'next/server';
import { tagRepository } from '@/lib/db/repositories/tagRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const { tag } = await params;
    const decodedTag = decodeURIComponent(tag);
    const tags = await tagRepository.deleteTag(decodedTag);
    return NextResponse.json({ success: true, tags });
  } catch (err: any) {
    console.error('Delete tag error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
