import { NextRequest, NextResponse } from 'next/server';
import { settingsRepository } from '@/lib/db/repositories/settingsRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  const settings = await settingsRepository.getSettings();
  return NextResponse.json({ success: true, settings });
}

export async function PUT(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const updates = await req.json();
    const updated = await settingsRepository.updateSettings(updates);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Update settings error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
