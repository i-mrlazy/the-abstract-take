import { NextRequest, NextResponse } from 'next/server';
import { validateAutomationSecret } from '@/lib/auth';

function getBaseUrl(req: NextRequest): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.SITE_BASE_URL) {
    return process.env.SITE_BASE_URL.replace(/\/$/, '');
  }
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  if (!validateAutomationSecret(req)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing automation secret key.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    service: 'The Abstract Take — Google Sheets Automation Engine (Next.js App Router)',
    authenticated: true,
    timestamp: new Date().toISOString(),
    baseUrl: getBaseUrl(req),
  });
}
