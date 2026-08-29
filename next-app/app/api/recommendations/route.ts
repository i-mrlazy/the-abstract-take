import { NextRequest, NextResponse } from 'next/server';
import { recommendationRepository } from '@/lib/db/repositories/recommendationRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  const statusParam = req.nextUrl.searchParams.get('status');
  const includeDrafts = Boolean(admin && statusParam === 'all');

  const lists = await recommendationRepository.getAll(includeDrafts);
  return NextResponse.json({ success: true, lists });
}

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const listData = await req.json();
    const saved = await recommendationRepository.saveList(listData);
    return NextResponse.json({ success: true, list: saved });
  } catch (err: any) {
    console.error('Save recommendation error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
