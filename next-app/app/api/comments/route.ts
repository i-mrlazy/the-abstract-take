import { NextRequest, NextResponse } from 'next/server';
import { commentRepository } from '@/lib/db/repositories/commentRepository';
import { settingsRepository } from '@/lib/db/repositories/settingsRepository';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  const includeAll = Boolean(admin);

  const comments = await commentRepository.getAll(includeAll);
  return NextResponse.json({ success: true, comments });
}

export async function POST(req: NextRequest) {
  try {
    const { reviewId, reviewTitle, userName, content } = await req.json();
    if (!reviewId || !userName || !content) {
      return NextResponse.json(
        { error: 'MissingFields', message: 'Review ID, name, and comment are required.' },
        { status: 400 }
      );
    }

    const settings = await settingsRepository.getSettings();
    const comment = await commentRepository.addComment({
      id: `comment-${Date.now()}`,
      reviewId,
      reviewTitle,
      userName: String(userName).trim(),
      content: String(content).trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      status: settings.autoApproveComments ? 'approved' : 'pending',
    });

    return NextResponse.json({
      success: true,
      comment,
      message: settings.autoApproveComments ? 'Comment posted!' : 'Comment submitted for moderation.',
    });
  } catch (err: any) {
    console.error('Submit comment error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
