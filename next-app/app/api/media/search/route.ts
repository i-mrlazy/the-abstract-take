import { NextRequest, NextResponse } from 'next/server';
import { searchMediaMetadata } from '@/lib/media/search';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const query = req.nextUrl.searchParams.get('q') || '';
    const type = req.nextUrl.searchParams.get('type') || undefined;

    if (!query.trim()) {
      return NextResponse.json({ success: true, results: [] });
    }

    const results = await searchMediaMetadata(query, type);
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('Media search error:', err);
    return NextResponse.json({ error: 'MediaSearchFailed', message: err.message }, { status: 500 });
  }
}
