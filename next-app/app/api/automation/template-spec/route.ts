import { NextRequest, NextResponse } from 'next/server';
import { validateAutomationSecret } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!validateAutomationSecret(req)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing automation secret key.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    standardColumns: [
      'TITLE',
      'RELEASE YEAR',
      'CONTENT TYPE',
      'EXTERNAL MEDIA ID',
      'RATING',
      'MY RAW TAKE',
      'THINGS I LIKED',
      'THINGS I DIDN\'T LIKE',
      'PERSONAL VERDICT',
      'ADDITIONAL NOTES',
      'GENERATED HEADLINE',
      'GENERATED REVIEW',
      'GENERATED PROS',
      'GENERATED CONS',
      'GENERATED VERDICT',
      'GENERATED SEO DESCRIPTION',
      'GENERATED TAGS',
      'GENERATION SOURCE',
      'STATUS',
      'PUBLISHED URL',
      'LAST PROCESSED',
      'AUTOMATION NOTES',
    ],
    optionalExtendedColumns: [
      'DIRECTOR',
      'CAST',
      'GENRES',
      'RUNTIME',
      'POSTER URL',
      'BACKDROP URL',
      'SYNOPSIS',
    ],
    columns: [
      'TITLE',
      'RELEASE YEAR',
      'CONTENT TYPE',
      'EXTERNAL MEDIA ID',
      'RATING',
      'MY RAW TAKE',
      'THINGS I LIKED',
      'THINGS I DIDN\'T LIKE',
      'PERSONAL VERDICT',
      'ADDITIONAL NOTES',
      'GENERATED HEADLINE',
      'GENERATED REVIEW',
      'GENERATED PROS',
      'GENERATED CONS',
      'GENERATED VERDICT',
      'GENERATED SEO DESCRIPTION',
      'GENERATED TAGS',
      'GENERATION SOURCE',
      'STATUS',
      'PUBLISHED URL',
      'LAST PROCESSED',
      'AUTOMATION NOTES',
    ],
    validStatuses: ['Pending', 'Review generated', 'Publish it', 'Published'],
    minimumRequiredForGeneration: [
      'TITLE',
      'RELEASE YEAR',
      'CONTENT TYPE',
      'RATING',
      'MY RAW TAKE',
      'PERSONAL VERDICT',
    ],
    minimumRequiredForPublishing: [
      'TITLE',
      'RELEASE YEAR',
      'CONTENT TYPE',
      'RATING',
      'STATUS = "Publish it"',
    ],
  });
}
