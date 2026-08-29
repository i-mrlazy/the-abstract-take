import { NextRequest, NextResponse } from 'next/server';
import { analyticsRepository } from '@/lib/db/repositories/analyticsRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  const analytics = await analyticsRepository.getSummary();
  return NextResponse.json({ success: true, analytics });
}
