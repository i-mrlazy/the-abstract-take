import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ authenticated: false, message: 'No active session' }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user,
  });
}
