import { NextRequest, NextResponse } from 'next/server';
import { processEditorialDraft } from '@/lib/editorial/assistant';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      year,
      contentType,
      rating,
      rawTake,
      likes,
      dislikes,
      personalVerdict,
      verifiedFacts,
      contextualBackground,
    } = body;

    if (!title && !rawTake) {
      return NextResponse.json({ error: 'MissingFields', message: 'Title or raw notes are required.' }, { status: 400 });
    }

    const result = await processEditorialDraft({
      title: title || 'Untitled Review',
      year,
      contentType: contentType || 'Movie',
      rating: Number(rating) || 8,
      rawTake: rawTake || '',
      likes,
      dislikes,
      personalVerdict,
      verifiedFacts,
      contextualBackground,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Editorial Assistant error:', err);
    return NextResponse.json({ error: 'GenerationFailed', message: err.message }, { status: 500 });
  }
}
