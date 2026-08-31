import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { AbstractScoreBadge } from '@/components/ui/AbstractScoreBadge';
import { ReviewArtwork } from '@/components/ui/ReviewArtwork';
import { SpoilerSection } from '@/components/reviews/SpoilerSection';
import { InteractiveActions } from '@/components/reviews/InteractiveActions';
import { ArrowLeft, CheckCircle2, XCircle, Quote } from 'lucide-react';
import { normalizeScore } from '@/lib/utils/rating';

import { buildReviewMetadata } from '@/lib/seo/metadata';
import { generateReviewStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo/structuredData';

interface ReviewPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // ISR: Revalidate every hour

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const review = await db.getReviewBySlug(slug);

  if (!review || (review.status && review.status !== 'published')) {
    return {
      title: 'Review Not Found | The Abstract Take',
    };
  }

  return buildReviewMetadata(review);
}

export default async function ReviewDetailPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  const review = await db.getReviewBySlug(slug);

  if (!review || (review.status && review.status !== 'published')) {
    notFound();
  }

  const reviewJsonLd = generateReviewStructuredData(review);
  const breadcrumbsJsonLd = generateBreadcrumbStructuredData([
    { name: 'Home', path: '/' },
    { name: 'Reviews', path: '/reviews' },
    { name: review.type || 'Movies', path: `/${(review.type || 'movies').toLowerCase().replace(/\s+/g, '-')}` },
    { name: review.title, path: `/reviews/${review.slug}` },
  ]);

  return (
    <article className="py-8 md:py-12 min-w-0">
      {/* Schema.org Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/movies"
            className="inline-flex items-center space-x-2 text-xs font-mono text-gray-500 hover:text-[#008CFF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO ARCHIVES</span>
          </Link>
        </div>

        {/* Title Header */}
        <header className="space-y-4 mb-8 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-gray-800 shrink-0">
              {review.type}
            </span>
            <span className="text-xs font-mono text-gray-500">•</span>
            <span className="text-xs font-mono text-gray-600">{review.releaseYear}</span>
            <span className="text-xs font-mono text-gray-500">•</span>
            <span className="text-xs font-mono text-gray-600 truncate">Dir. {review.director}</span>
          </div>

          <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-gray-950 tracking-tight leading-tight break-words">
            {review.title}
          </h1>

          {/* Author Bar & Interactive Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                <Image
                  src={review.author.avatarUrl}
                  alt={review.author.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-gray-900 truncate">{review.author.name}</p>
                <p className="font-mono text-[11px] text-gray-500 truncate">
                  {new Date(review.publishDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' '}• {review.readingTimeMinutes} min read
                </p>
              </div>
            </div>

            <InteractiveActions reviewId={review.id} initialLikes={review.likesCount} />
          </div>
        </header>

        {/* Hero Poster / Banner */}
        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-gray-900 mb-10 shadow-sm">
          <ReviewArtwork
            title={review.title}
            releaseYear={review.releaseYear}
            type={review.type}
            slug={review.slug}
            posterUrl={review.posterUrl}
            bannerUrl={review.bannerUrl}
            artwork={review.artwork}
            abstractScore={review.abstractScore}
            preferredType="backdrop"
            aspectRatio="landscape"
            priority={true}
            sizes="(max-width: 1024px) 100vw, 896px"
            alt={review.bannerAlt || review.posterAlt || review.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* The Abstract Score Verdict Card */}
        <div className="bg-white border-2 border-gray-900/10 rounded-3xl p-5 sm:p-8 mb-10 shadow-sm min-w-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-gray-100 text-center sm:text-left min-w-0">
            <div className="space-y-2 min-w-0">
              <span className="text-xs font-mono font-bold tracking-widest text-[#008CFF] uppercase">
                Signature Editorial Judgment
              </span>
              <h2 className="font-serif font-black text-2xl text-gray-950">The Abstract Score</h2>
              <p className="font-news text-base text-gray-700 leading-relaxed max-w-xl break-words">
                {review.verdictText}
              </p>
            </div>
            <div className="shrink-0">
              <AbstractScoreBadge score={review.abstractScore} size="hero" showDescriptor />
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
            <div className="space-y-3 min-w-0">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>What Works</span>
              </h3>
              <ul className="space-y-2">
                {review.pros.map((pro: string, idx: number) => (
                  <li key={idx} className="font-news text-sm text-gray-800 flex items-start space-x-2 break-words">
                    <span className="text-emerald-500 font-bold shrink-0">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 min-w-0">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center space-x-1.5">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>What Holds It Back</span>
              </h3>
              <ul className="space-y-2">
                {review.cons.map((con: string, idx: number) => (
                  <li key={idx} className="font-news text-sm text-gray-800 flex items-start space-x-2 break-words">
                    <span className="text-rose-500 font-bold shrink-0">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Creator Core Thesis Callout */}
        <div className="my-8 p-5 sm:p-6 bg-[#008CFF]/5 border-l-4 border-[#008CFF] rounded-r-2xl min-w-0">
          <span className="text-[11px] font-mono font-bold tracking-widest text-[#008CFF] uppercase block mb-1">
            The Creator&apos;s Raw Take
          </span>
          <p className="font-serif italic font-bold text-lg sm:text-xl text-gray-950 leading-snug break-words">
            &ldquo;{review.myTake}&rdquo;
          </p>
        </div>

        {/* Long Form Editorial Review */}
        <div className="font-news text-base sm:text-lg text-gray-800 leading-relaxed space-y-6 my-10 whitespace-pre-line break-words">
          {review.longFormReview}
        </div>

        {/* Favorite Scene / Quote */}
        {review.favoriteQuote && (
          <div className="my-8 p-5 sm:p-6 bg-gray-50 border border-gray-200 rounded-2xl flex items-start space-x-4 min-w-0">
            <Quote className="w-7 h-7 sm:w-8 sm:h-8 text-[#008CFF] shrink-0 opacity-40 mt-1" />
            <div className="min-w-0">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Memorable Line
              </span>
              <p className="font-serif italic text-base text-gray-900 break-words">&ldquo;{review.favoriteQuote}&rdquo;</p>
            </div>
          </div>
        )}

        {/* Collapsible Spoilers (Client Island) */}
        {review.spoilerSection && <SpoilerSection content={review.spoilerSection} />}

        {/* Metadata Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200/80 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-gray-500 mr-2 shrink-0">Genres:</span>
            {review.genres.map((g: string) => (
              <span
                key={g}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-700"
              >
                {g}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-gray-500 mr-2 shrink-0">Cast:</span>
            {review.cast.map((c: string) => (
              <span
                key={c}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-700"
              >
                {c}
              </span>
            ))}
          </div>
        </footer>
      </div>
    </article>
  );
}
