import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AbstractScoreBadge } from '@/components/ui/AbstractScoreBadge';
import { ReviewArtwork } from '@/components/ui/ReviewArtwork';
import { ArrowLeft, Tv, ArrowUpRight } from 'lucide-react';

import { buildRecommendationMetadata } from '@/lib/seo/metadata';
import { generateRecommendationStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo/structuredData';

interface RecommendsSlugPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: RecommendsSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const list = await db.getRecommendationBySlug(slug);

  if (!list || (list.status && list.status !== 'published')) {
    return {
      title: 'Watchlist Not Found | The Abstract Take',
    };
  }

  return buildRecommendationMetadata(list);
}

export default async function RecommendsCollectionPage({ params }: RecommendsSlugPageProps) {
  const { slug } = await params;
  const list = await db.getRecommendationBySlug(slug);

  if (!list || (list.status && list.status !== 'published')) {
    notFound();
  }

  const itemListJsonLd = generateRecommendationStructuredData(list);
  const breadcrumbsJsonLd = generateBreadcrumbStructuredData([
    { name: 'Home', path: '/' },
    { name: 'The Abstract Recommends', path: '/recommends' },
    { name: list.title, path: `/recommends/${list.slug || list.id}` },
  ]);

  return (
    <article className="py-8 md:py-12 min-w-0">
      {/* Schema.org Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/recommends"
            className="inline-flex items-center space-x-2 text-xs font-mono text-gray-500 hover:text-[#008CFF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO ALL WATCHLISTS</span>
          </Link>
        </div>

        {/* Collection Header */}
        <header className="space-y-4 mb-10 pb-8 border-b border-gray-200/80 min-w-0">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-[#008CFF]/10 text-[#008CFF] rounded-full text-xs font-mono font-bold uppercase tracking-wider shrink-0">
              {list.category}
            </span>
            <span className="text-xs font-mono text-gray-500">•</span>
            <span className="text-xs font-mono text-gray-600">{list.items.length} Curated Works</span>
          </div>

          <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-gray-950 tracking-tight leading-tight break-words">
            {list.title}
          </h1>

          {list.subtitle && (
            <p className="font-serif italic text-lg sm:text-xl text-gray-700 leading-snug break-words">
              {list.subtitle}
            </p>
          )}

          <p className="font-news text-base sm:text-lg text-gray-700 leading-relaxed max-w-3xl break-words">
            {list.description}
          </p>

          <div className="pt-2 text-xs font-mono text-gray-500">
            Curated by <span className="font-bold text-gray-800">{list.curatorName}</span>
          </div>
        </header>

        {/* List Items */}
        <div className="space-y-8 min-w-0">
          {list.items.map((item, index) => (
            <div
              key={item.id || index}
              className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-8 shadow-xs hover:border-[#008CFF]/40 transition-all flex flex-col md:flex-row gap-6 sm:gap-8 items-start min-w-0"
            >
              {/* Item Poster */}
              <div className="w-full sm:w-48 md:w-48 shrink-0 relative aspect-[2/3] bg-gray-900 rounded-2xl overflow-hidden shadow-2xs">
                <ReviewArtwork
                  title={item.title}
                  releaseYear={Number(item.year || item.releaseYear) || undefined}
                  type={item.type}
                  posterUrl={item.posterUrl}
                  abstractScore={item.abstractScore}
                  preferredType="poster"
                  aspectRatio="portrait"
                  sizes="(max-width: 640px) 100vw, 192px"
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 w-7 h-7 bg-[#111111]/85 backdrop-blur-xs text-white rounded-lg flex items-center justify-center font-mono font-bold text-xs z-10">
                  {index + 1}
                </div>
              </div>

              {/* Item Info & Curator Note */}
              <div className="flex-1 flex flex-col justify-between space-y-4 min-w-0 w-full">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2 text-xs font-mono text-gray-500 min-w-0">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 shrink-0">{item.type}</span>
                      <span className="shrink-0">•</span>
                      <span className="shrink-0">{item.year || item.releaseYear}</span>
                      <span className="shrink-0">•</span>
                      <span className="truncate min-w-0">Dir. {item.director}</span>
                    </div>

                    <AbstractScoreBadge score={item.abstractScore} size="sm" />
                  </div>

                  <h2 className="font-serif font-black text-xl sm:text-2xl text-gray-950 break-words">
                    {item.title}
                  </h2>

                  <div className="mt-4 p-4 bg-gray-50/80 border-l-3 border-[#008CFF] rounded-r-xl min-w-0">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#008CFF] uppercase block mb-1">
                      Curator Commentary
                    </span>
                    <p className="font-news text-sm sm:text-base text-gray-800 leading-relaxed break-words">
                      &ldquo;{item.curatorNote}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 text-xs font-mono">
                  <div className="flex items-center space-x-2 text-gray-600 min-w-0">
                    <Tv className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">Where to watch: <strong className="text-gray-900">{item.whereToWatch}</strong></span>
                  </div>

                  {item.reviewId && (
                    <Link
                      href={`/reviews/${item.reviewId}`}
                      className="inline-flex items-center space-x-1 text-[#008CFF] font-bold hover:underline shrink-0"
                    >
                      <span>Read Deep-Dive Review</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
