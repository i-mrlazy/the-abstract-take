import { NextRequest, NextResponse } from 'next/server';
import { subscriberRepository } from '@/lib/db/repositories/subscriberRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  const subscribers = await subscriberRepository.getAll();
  const headers = 'ID,Email,SubscribedDate,Status,Preference\n';
  const rows = subscribers
    .map(
      (s) =>
        `"${s.id}","${s.email}","${s.subscribedAt}","${s.status}","${s.preference || 'all'}"`
    )
    .join('\n');

  const csvContent = headers + rows;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="abstract-dispatch-subscribers.csv"',
    },
  });
}
