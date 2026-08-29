import { NextRequest, NextResponse } from 'next/server';
import { whatNextRepository } from '@/lib/db/repositories/whatNextRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  const items = await whatNextRepository.getAll();
  return NextResponse.json({ success: true, items });
}

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const itemData = await req.json();
    const saved = await whatNextRepository.saveItem(itemData);
    return NextResponse.json({ success: true, item: saved });
  } catch (err: any) {
    console.error('Save what-to-watch error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
