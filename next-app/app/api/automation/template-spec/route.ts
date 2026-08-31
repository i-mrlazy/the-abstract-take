import { NextRequest, NextResponse } from 'next/server';
import { validateAutomationSecret } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!validateAutomationSecret(req)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing automation secret key.' },
      { status: 401 }
    );
  }

  // Phase 5.3 34-Column Editorial Memory Specification
  const columns = [
    // FOUNDER MEMORY / INPUT (A–K)
    'TITLE', // A (Col 1)
    'RELEASE YEAR', // B (Col 2)
    'CONTENT TYPE', // C (Col 3)
    'FOUNDER ABSTRACT SCORE', // D (Col 4)
    'QUICK THESIS', // E (Col 5)
    'WHAT WORKED', // F (Col 6)
    'WHAT DIDNT', // G (Col 7)
    'FAVORITE SCENE', // H (Col 8)
    'FAVORITE QUOTE', // I (Col 9)
    'VIEWING MEMORY NOTES', // J (Col 10)
    'TARGET REVIEW LENGTH', // K (Col 11)

    // FACTUAL METADATA (OPTIONAL / PRE-FILLED) (L–Q)
    'ORIGINAL TITLE', // L (Col 12)
    'DIRECTOR / CREATOR', // M (Col 13)
    'LEAD CAST', // N (Col 14)
    'RUNTIME', // O (Col 15)
    'PRIMARY GENRES', // P (Col 16)
    'THEMES & MOODS', // Q (Col 17)

    // AI GENERATION (R–V)
    'GENERATION STATUS', // R (Col 18)
    'GENERATED JSON', // S (Col 19)
    'GENERATED REVIEW PREVIEW', // T (Col 20)
    'AI GENERATION NOTES', // U (Col 21)
    'GENERATION TIMESTAMP', // V (Col 22)

    // EDITORIAL REVIEW (W–AA)
    'EDITORIAL STATUS', // W (Col 23)
    'FOUNDER REVIEW NOTES', // X (Col 24)
    'FINAL APPROVED JSON', // Y (Col 25)
    'APPROVED BY', // Z (Col 26)
    'APPROVAL TIMESTAMP', // AA (Col 27)

    // PUBLICATION (AB–AE)
    'CMS IMPORT STATUS', // AB (Col 28)
    'WEBSITE PUBLICATION STATUS', // AC (Col 29)
    'PUBLISHED URL', // AD (Col 30)
    'PUBLICATION TIMESTAMP', // AE (Col 31)

    // SYSTEM (AF–AH)
    'INTERNAL ID', // AF (Col 32)
    'ERROR LOG', // AG (Col 33)
    'LAST UPDATED', // AH (Col 34)
  ];

  return NextResponse.json({
    version: '5.3.0',
    pipeline: 'Editorial Memory Capture & AI Review Generation Pipeline',
    totalColumns: columns.length,
    columns,
    stateMachines: {
      generationStatus: [
        'NOT_STARTED',
        'READY_FOR_GENERATION',
        'GENERATING',
        'GENERATED',
        'GENERATION_FAILED',
      ],
      editorialStatus: [
        'MEMORY_CAPTURE',
        'AI_DRAFT_READY',
        'NEEDS_REVIEW',
        'NEEDS_REVISION',
        'APPROVED',
        'REJECTED',
      ],
      publicationStatus: [
        'NOT_IMPORTED',
        'IMPORTED_TO_CMS',
        'DRAFT',
        'SCHEDULED',
        'PUBLISHED',
      ],
      cmsImportStatus: [
        'NOT_IMPORTED',
        'IMPORTED_TO_CMS',
        'IMPORT_FAILED',
        'DUPLICATE_SKIPPED',
      ],
    },
    lengthTiers: ['Quick Take', 'Standard Take', 'Deep Take', 'Essay'],
    minimumRequiredForGeneration: ['TITLE', 'FOUNDER ABSTRACT SCORE'],
    rules: {
      scoreAuthority: 'The founder score is authoritative and never altered by AI.',
      founderApprovalRequired: 'All reviews must be founder-approved and imported as CMS drafts before publishing.',
      noHallucinatedExperiences: 'AI extracts editorial signals without fabricating unmentioned personal memories.',
      duplicateAction: 'Skip duplicates by default (based on normalized title + year and slug).',
    },
  });
}
