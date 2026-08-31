import { NextRequest, NextResponse } from 'next/server';
import { reviewRepository } from '@/lib/db/repositories/reviewRepository';
import { validateAutomationSecret, getAuthenticatedAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils/slug';
import { normalizeScore } from '@/lib/utils/rating';
import { resolveReviewArtwork } from '@/lib/editorial/reviewArtwork';
import { Review, MediaType, WatchVerdict } from '@/types';

function parseList(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  return String(input)
    .split(/[\n,;•]+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean);
}

function mapCategory(type: MediaType): string {
  switch (type) {
    case 'Movie':
      return 'Movies';
    case 'Series':
    case 'Mini Series':
      return 'Series';
    case 'Anime':
      return 'Anime';
    case 'Documentary':
      return 'Documentaries';
    default:
      return 'Critique';
  }
}

export async function POST(req: NextRequest) {
  // Authentication: Check either Automation Secret or Admin User Session
  const isSecretValid = validateAutomationSecret(req);
  let isAdminUser = false;

  if (!isSecretValid) {
    const admin = await getAuthenticatedAdmin(req);
    if (admin) {
      isAdminUser = true;
    }
  }

  if (!isSecretValid && !isAdminUser) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Admin authentication or valid automation secret is required to import reviews.',
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    let itemsToImport: any[] = [];

    if (Array.isArray(body)) {
      itemsToImport = body;
    } else if (Array.isArray(body.reviews)) {
      itemsToImport = body.reviews;
    } else if (body.review && typeof body.review === 'object') {
      itemsToImport = [body.review];
    } else if (body.title) {
      itemsToImport = [body];
    }

    if (itemsToImport.length === 0) {
      return NextResponse.json(
        { error: 'EmptyPayload', message: 'No review items provided for import.' },
        { status: 400 }
      );
    }

    // Safety limit on batch imports
    const MAX_BATCH_SIZE = 50;
    if (itemsToImport.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          error: 'BatchLimitExceeded',
          message: `Maximum import batch size is ${MAX_BATCH_SIZE} reviews per request.`,
        },
        { status: 400 }
      );
    }

    const duplicateMode = body.duplicateMode || 'skip'; // 'skip' | 'update'
    const importedResults: any[] = [];
    const skippedDuplicates: any[] = [];
    const failedItems: any[] = [];

    // Fetch existing reviews to verify duplicates
    const allExistingReviews = await reviewRepository.getAll(true);

    for (let index = 0; index < itemsToImport.length; index++) {
      const item = itemsToImport[index];
      const rawTitle = String(item.title || '').trim();

      if (!rawTitle) {
        failedItems.push({
          index,
          rowId: item.rowId,
          error: 'Title is required for import.',
        });
        continue;
      }

      const releaseYear = Number(item.releaseYear || item.year) || new Date().getFullYear();
      const normScore = normalizeScore(item.abstractScore || item.rating || item.score || 8);
      const cleanType: MediaType = (['Movie', 'Series', 'Mini Series', 'Anime', 'Documentary', 'Special'].includes(
        item.type || item.contentType
      )
        ? item.type || item.contentType
        : 'Movie') as MediaType;

      const baseSlug = item.slug ? slugify(item.slug) : `${slugify(rawTitle)}-${releaseYear}`;

      // Duplicate Check:
      // 1. Normalized title + year match
      // 2. Exact slug match
      // 3. automationRowId match (if provided)
      const existingMatch = allExistingReviews.find(
        (r) =>
          (r.title.toLowerCase().trim() === rawTitle.toLowerCase().trim() && r.releaseYear === releaseYear) ||
          r.slug === baseSlug ||
          (item.rowId && r.automationRowId === String(item.rowId))
      );

      if (existingMatch && duplicateMode === 'skip') {
        skippedDuplicates.push({
          index,
          rowId: item.rowId,
          title: rawTitle,
          releaseYear,
          existingSlug: existingMatch.slug,
          existingId: existingMatch.id,
          reason: 'Duplicate title/year or slug already exists in database.',
        });
        continue;
      }

      try {
        const longForm =
          item.longFormReview ||
          item.editorialReview ||
          item.rawTake ||
          `${rawTitle} is an essential ${cleanType.toLowerCase()} reviewed on The Abstract Take.`;

        const wordCount = longForm.trim().split(/\s+/).filter(Boolean).length;
        const readTime = Math.max(2, Math.round(wordCount / 180));

        const pros = parseList(item.pros || item.whatWorked || item.likes);
        const cons = parseList(item.cons || item.whatDidnt || item.dislikes);
        const tags = parseList(item.tags || [cleanType, 'The Abstract Take', `${cleanType} Review`]);

        // Resolve Artwork
        const resolvedArtwork = resolveReviewArtwork({
          title: rawTitle,
          releaseYear,
          slug: baseSlug,
          posterUrl: item.posterUrl || item.poster,
          bannerUrl: item.bannerUrl || item.banner,
          artwork: item.artwork,
        });

        const reviewId = existingMatch && duplicateMode === 'update'
          ? existingMatch.id
          : `review-${Date.now()}-${index}-${slugify(rawTitle)}`;

        const finalSlug = existingMatch && duplicateMode === 'update'
          ? existingMatch.slug
          : baseSlug;

        // Construct Draft Review
        const newDraftReview: Review = {
          id: reviewId,
          slug: finalSlug,
          title: rawTitle,
          originalTitle: item.originalTitle ? String(item.originalTitle).trim() : existingMatch?.originalTitle,
          type: cleanType,
          // CRITICAL REQUIREMENT: Always import as 'draft' for founder review in CMS
          status: 'draft',
          releaseYear,
          director: String(item.director || item.creator || existingMatch?.director || 'Editorial Curator').trim(),
          cast: parseList(item.cast || existingMatch?.cast),
          runtime: String(item.runtime || existingMatch?.runtime || (cleanType === 'Movie' ? '2h 00m' : '45m / ep')).trim(),
          genres: parseList(item.genres || existingMatch?.genres).length
            ? parseList(item.genres || existingMatch?.genres)
            : [cleanType, 'Cinema'],
          posterUrl: resolvedArtwork.url,
          bannerUrl: resolvedArtwork.url,
          artwork: {
            poster: resolvedArtwork.url,
            backdrop: resolvedArtwork.url,
            sourceType: resolvedArtwork.sourceType,
            sourceName: resolvedArtwork.sourceName,
            verified: resolvedArtwork.verified,
          },
          abstractScore: normScore,
          myTake: String(
            item.myTake ||
              item.headline ||
              item.rawTake ||
              `${rawTitle} earns a ${normScore}/10 on The Abstract Take scale.`
          ).trim(),
          streamingPlatforms: existingMatch?.streamingPlatforms || [
            { name: 'Max', type: 'Subscription' },
            { name: 'Apple TV', type: 'Rent/Buy' },
          ],
          pros: pros.length ? pros : ['Distinct aesthetic direction', 'Focused character execution'],
          cons,
          verdictText: String(
            item.verdictText ||
              item.verdict ||
              item.personalVerdict ||
              `${rawTitle} earns an authoritative ${normScore}/10 on The Abstract Take.`
          ).trim(),
          shouldYouWatch: item.shouldYouWatch || (normScore >= 8 ? 'Must Watch' : normScore >= 6 ? 'Recommended' : 'For Fans'),
          longFormReview: longForm,
          spoilerFreeTake: item.spoilerFreeTake || item.personalVerdict || undefined,
          favoriteScene: item.favoriteScene || existingMatch?.favoriteScene || 'Opening sequence establishing tone.',
          favoriteQuote: item.favoriteQuote || existingMatch?.favoriteQuote || '',
          publishDate: existingMatch?.publishDate || new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          author: {
            name: 'The Abstract Take',
            title: 'Chief Cinema Critic',
            avatarUrl:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          },
          category: mapCategory(cleanType),
          tags,
          viewsCount: existingMatch?.viewsCount || 0,
          likesCount: existingMatch?.likesCount || 0,
          commentsCount: existingMatch?.commentsCount || 0,
          readingTimeMinutes: readTime,
          synopsis: item.synopsis || existingMatch?.synopsis || undefined,
          seo: {
            metaTitle: `${rawTitle} (${releaseYear}) Review — The Abstract Take`,
            metaDescription: `Editorial review for ${rawTitle}. Score: ${normScore}/10.`,
            keywords: [rawTitle, cleanType, 'The Abstract Take'],
            slug: finalSlug,
            ogImage: resolvedArtwork.url,
          },
          recommendationMetadata: item.recommendationMetadata || {
            themes: parseList(item.themes).length ? parseList(item.themes) : ['Identity', 'Human Nature'],
            moods: parseList(item.moods).length ? parseList(item.moods) : ['Atmospheric', 'Thought-Provoking'],
            pacing: item.pacing || 'Moderate',
            audienceExperience: ['Thought-Provoking'],
          },
          generationMetadata: {
            source: 'editorial-memory-pipeline',
            founderScore: true,
            founderNotesProvided: true,
            targetLength: item.generationMetadata?.targetLength || 'Standard Take',
            requiresEditorialApproval: true,
            generatedAt: item.generationMetadata?.generatedAt || new Date().toISOString(),
            approvedAt: new Date().toISOString(),
            approvedBy: isAdminUser ? 'CMS Admin' : 'Google Sheets Automation',
          },
          source: 'google_sheets_automation',
          automationRowId: item.rowId ? String(item.rowId) : undefined,
        };

        const saved = existingMatch && duplicateMode === 'update'
          ? await reviewRepository.updateReview(newDraftReview)
          : await reviewRepository.createReview(newDraftReview);

        // Update local list so subsequent items in the batch detect duplicates accurately
        allExistingReviews.push(saved);

        importedResults.push({
          id: saved.id,
          slug: saved.slug,
          title: saved.title,
          status: saved.status,
          score: saved.abstractScore,
          isUpdate: Boolean(existingMatch && duplicateMode === 'update'),
          rowId: item.rowId,
        });
      } catch (saveErr: any) {
        console.error(`Import failed for item ${rawTitle}:`, saveErr);
        failedItems.push({
          index,
          rowId: item.rowId,
          title: rawTitle,
          error: saveErr.message || 'Unknown database error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: itemsToImport.length,
      importedCount: importedResults.length,
      skippedCount: skippedDuplicates.length,
      failedCount: failedItems.length,
      imported: importedResults,
      duplicates: skippedDuplicates,
      errors: failedItems,
      message: `Successfully imported ${importedResults.length} review(s) as CMS drafts. ${skippedDuplicates.length} duplicate(s) skipped.`,
    });
  } catch (err: any) {
    console.error('Import reviews exception:', err);
    return NextResponse.json(
      {
        error: 'ImportExecutionError',
        message: err.message || 'Server error while executing bulk review import.',
      },
      { status: 500 }
    );
  }
}
