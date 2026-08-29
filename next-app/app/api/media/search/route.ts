import { NextRequest, NextResponse } from 'next/server';
import { searchMediaDetailed, getProviderStatus } from '@/lib/media/search';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const query = req.nextUrl.searchParams.get('q') || '';
    const type = req.nextUrl.searchParams.get('type') || undefined;

    const status = getProviderStatus();

    if (!query.trim()) {
      return NextResponse.json({ success: true, results: [], provider: status.activeProvider, status });
    }

    const { results, provider } = await searchMediaDetailed(query, type);
    return NextResponse.json({ success: true, results, provider, status });
  } catch (err: any) {
    console.error('Media search error:', err);
    return NextResponse.json({ error: 'MediaSearchFailed', message: err.message }, { status: 500 });
  }
}
