import { NextRequest, NextResponse } from 'next/server';
import { tagRepository } from '@/lib/db/repositories/tagRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  const tags = await tagRepository.getTags();
  return NextResponse.json({ success: true, tags });
}

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const { tag } = await req.json();
    if (!tag) {
      return NextResponse.json({ error: 'MissingTag', message: 'Tag name is required.' }, { status: 400 });
    }

    const tags = await tagRepository.addTag(tag);
    return NextResponse.json({ success: true, tags });
  } catch (err: any) {
    console.error('Add tag error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
