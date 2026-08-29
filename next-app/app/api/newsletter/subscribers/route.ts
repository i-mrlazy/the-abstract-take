import { NextRequest, NextResponse } from 'next/server';
import { subscriberRepository } from '@/lib/db/repositories/subscriberRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  const subscribers = await subscriberRepository.getAll();
  return NextResponse.json({ success: true, subscribers, count: subscribers.length });
}
