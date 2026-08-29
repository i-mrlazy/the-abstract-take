import { NextRequest, NextResponse } from 'next/server';
import { processEditorialDraft } from '@/lib/editorial/assistant';
import { validateAutomationSecret } from '@/lib/auth';
import { MediaType } from '@/types';

export async function POST(req: NextRequest) {
  if (!validateAutomationSecret(req)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing automation secret key.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      releaseYear,
      year,
      contentType,
      rating,
      rawTake,
      likes,
      dislikes,
      personalVerdict,
      additionalNotes,
      externalId,
      rowId,
    } = body;

    const actualTitle = title ? String(title).trim() : '';
    const actualRawTake = rawTake ? String(rawTake).trim() : '';
    const actualVerdict = personalVerdict ? String(personalVerdict).trim() : '';

    if (!actualTitle || !actualRawTake || !actualVerdict) {
      return NextResponse.json(
        {
          error: 'MissingRequiredFields',
          message: 'Title, My Raw Take, and Personal Verdict are required for editorial generation.',
        },
        { status: 400 }
      );
    }

    const normScore = Math.max(1, Math.min(10, Math.round(Number(rating) || 8)));
    const cleanType: MediaType = (contentType as MediaType) || 'Movie';
    const cleanYear = Number(releaseYear || year) || new Date().getFullYear();

    const draftResult = await processEditorialDraft({
      title: actualTitle,
      year: cleanYear,
      contentType: cleanType,
      rating: normScore,
      rawTake: actualRawTake,
      likes: likes ? String(likes) : undefined,
      dislikes: dislikes ? String(dislikes) : undefined,
      personalVerdict: actualVerdict,
      verifiedFacts: additionalNotes ? String(additionalNotes) : undefined,
      contextualBackground: externalId ? `External ID: ${externalId}` : undefined,
    });

    const tags = [
      cleanType,
      `${cleanType} Review`,
      'The Abstract Take',
      normScore >= 9 ? 'Masterpiece' : normScore >= 8 ? 'Must Watch' : 'Editorial Review',
    ];

    const seoDescription = draftResult.myTakeHook
      ? `The Abstract Take's review of ${actualTitle}: "${draftResult.myTakeHook.slice(0, 140)}..." Score: ${normScore}/10.`
      : `Editorial review and Abstract Score (${normScore}/10) for ${actualTitle} (${cleanYear}).`;

    const sourceLabel = draftResult.generationSource === 'gemini' ? 'Gemini' : 'Fallback';
    const notes = draftResult.generationNote || (draftResult.generationSource === 'gemini'
      ? 'Generated via Gemini 2.5 Flash Editorial Assistant'
      : 'Gemini unavailable — deterministic fallback draft generated');

    return NextResponse.json({
      success: true,
      rowId,
      status: 'Review generated',
      generationSource: sourceLabel,
      automationNotes: notes,
      data: {
        title: actualTitle,
        releaseYear: cleanYear,
        contentType: cleanType,
        rating: normScore,
        headline: draftResult.headline,
        editorialReview: draftResult.editorialReview,
        pros: draftResult.pros.join('\n'),
        cons: draftResult.cons.join('\n'),
        verdict: draftResult.verdictText,
        seoDescription,
        tags: tags.join(', '),
        shouldYouWatch: draftResult.shouldYouWatch,
        myTakeHook: draftResult.myTakeHook,
        generationSource: sourceLabel,
        automationNotes: notes,
        status: 'Review generated',
      },
    });
  } catch (err: any) {
    console.error('Automation Generate Error:', err);
    return NextResponse.json(
      {
        error: 'GenerationFailed',
        message: err.message || 'Failed to generate editorial review.',
      },
      { status: 500 }
    );
  }
}
