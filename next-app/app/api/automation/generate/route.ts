import { NextRequest, NextResponse } from 'next/server';
import { generateEditorialMemoryReview, EditorialMemoryInput } from '@/lib/editorial/memoryPipeline';
import { validateAutomationSecret } from '@/lib/auth';
import { MediaType } from '@/types';
import { normalizeContentType, CANONICAL_MEDIA_TYPES } from '@/lib/utils/mediaType';

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
      type,
      rating,
      abstractScore,
      rawTake,
      myTake,
      likes,
      whatWorked,
      dislikes,
      whatDidnt,
      personalVerdict,
      favoriteScene,
      favoriteQuote,
      memoryNotes,
      viewingExperience,
      targetLength,
      additionalNotes,
      originalTitle,
      director,
      cast,
      runtime,
      genres,
      themes,
      moods,
      externalId,
      rowId,
    } = body;

    const actualTitle = title ? String(title).trim() : '';
    if (!actualTitle) {
      return NextResponse.json(
        {
          error: 'MissingTitle',
          generationStatus: 'GENERATION_FAILED',
          message: 'Title is required for editorial review generation.',
        },
        { status: 400 }
      );
    }

    const rawType = contentType || type || 'Movie';
    const normType = normalizeContentType(rawType);
    if (!normType) {
      return NextResponse.json(
        {
          error: 'InvalidContentType',
          generationStatus: 'GENERATION_FAILED',
          message: `Invalid Content Type "${rawType}". Must be one of: ${CANONICAL_MEDIA_TYPES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    const normScore = Math.max(1, Math.min(10, Math.round(Number(abstractScore || rating) || 8)));
    const cleanType: MediaType = normType;
    const cleanYear = Number(releaseYear || year) || new Date().getFullYear();

    const memoryInput: EditorialMemoryInput = {
      title: actualTitle,
      releaseYear: cleanYear,
      contentType: cleanType,
      type: cleanType,
      rating: normScore,
      abstractScore: normScore,
      rawTake: rawTake ? String(rawTake).trim() : myTake ? String(myTake).trim() : undefined,
      likes: whatWorked || likes,
      dislikes: whatDidnt || dislikes,
      personalVerdict: personalVerdict ? String(personalVerdict).trim() : undefined,
      favoriteScene: favoriteScene ? String(favoriteScene).trim() : undefined,
      favoriteQuote: favoriteQuote ? String(favoriteQuote).trim() : undefined,
      memoryNotes: memoryNotes ? String(memoryNotes).trim() : viewingExperience ? String(viewingExperience).trim() : additionalNotes ? String(additionalNotes).trim() : undefined,
      targetLength: targetLength || 'Standard Take',
      originalTitle: originalTitle ? String(originalTitle).trim() : undefined,
      director: director ? String(director).trim() : undefined,
      cast: cast || undefined,
      runtime: runtime ? String(runtime).trim() : undefined,
      genres: genres || undefined,
      themes: themes || undefined,
      moods: moods || undefined,
      externalId: externalId ? String(externalId).trim() : undefined,
      rowId: rowId ? String(rowId) : undefined,
    };

    const generated = await generateEditorialMemoryReview(memoryInput);

    const sourceLabel = generated.generationMetadata.source === 'editorial-memory-pipeline' ? 'Gemini 2.5 Flash' : 'Fallback Engine';
    const notes = `Generated via ${sourceLabel} · Grounded strictly in founder signals (Score: ${normScore}/10 · ${generated.scoreDescriptor})`;

    // Preview snippet for Google Sheets
    const previewText = `${generated.headline}\n\n${generated.longFormReview}\n\nVerdict: ${generated.verdictText} (${generated.shouldYouWatch})`;

    return NextResponse.json({
      success: true,
      rowId,
      generationStatus: 'GENERATED',
      editorialStatus: 'AI_DRAFT_READY',
      generationSource: sourceLabel,
      automationNotes: notes,
      generatedJson: JSON.stringify(generated),
      generatedPreview: previewText,
      data: {
        title: generated.title,
        originalTitle: generated.originalTitle,
        releaseYear: generated.releaseYear,
        type: generated.type,
        contentType: generated.type,
        abstractScore: generated.abstractScore,
        rating: generated.abstractScore,
        scoreDescriptor: generated.scoreDescriptor,
        headline: generated.headline,
        myTake: generated.myTake,
        myTakeHook: generated.myTake,
        editorialReview: generated.longFormReview,
        longFormReview: generated.longFormReview,
        pros: generated.pros,
        cons: generated.cons,
        verdictText: generated.verdictText,
        verdict: generated.verdictText,
        shouldYouWatch: generated.shouldYouWatch,
        spoilerFreeTake: generated.spoilerFreeTake,
        seoDescription: generated.seoDescription,
        tags: generated.tags,
        recommendationMetadata: generated.recommendationMetadata,
        generationMetadata: generated.generationMetadata,
        status: 'Review generated',
      },
    });
  } catch (err: any) {
    console.error('Automation Generate Error:', err);
    return NextResponse.json(
      {
        error: 'GenerationFailed',
        generationStatus: 'GENERATION_FAILED',
        message: err.message || 'Failed to generate editorial review.',
      },
      { status: 500 }
    );
  }
}
