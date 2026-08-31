import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { AbstractScoreBadge } from '@/components/ui/AbstractScoreBadge';
import { ReviewArtwork } from '@/components/ui/ReviewArtwork';
import { CuratorAiTrigger } from '@/components/ai/CuratorAiTrigger';
import { Compass, Tv } from 'lucide-react';

export const metadata: Metadata = {
  title: 'What Should I Watch Next? — The Abstract Take',
  description: 'Instant, curated cinema and series recommendations based on mood, artistic vibe, and critical caliber.',
  alternates: {
    canonical: 'https://the-abstract-take.vercel.app/what-to-watch-next',
  },
};

export const revalidate = 3600;

export default async function WhatToWatchNextPage() {
  const items = await db.getWhatToWatchNext();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10 min-w-0">
      {/* Header */}
      <header className="border-b border-gray-200/80 pb-6 space-y-3 min-w-0">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#008CFF]/10 text-[#008CFF] rounded-full text-xs font-mono font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          <span>Curated Discovery</span>
        </span>
        <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-gray-950 tracking-tight break-words">
          What Should I Watch Next?
        </h1>
        <p className="font-news text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
          Bespoke watch recommendations tailored for immediate mood, atmosphere, and cinematic appetite. Handpicked by the editor.
        </p>
        <div className="pt-2">
          <CuratorAiTrigger
            variant="banner"
            label="What Should I Watch Next? (Curator Engine)"
          />
        </div>
      </header>

      {/* Grid of Discovery Picks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 min-w-0">
        {items.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-xs hover:border-[#008CFF]/50 transition-all flex flex-col justify-between min-w-0"
          >
            <div className="relative aspect-[16/10] bg-gray-900 overflow-hidden">
              <ReviewArtwork
                title={item.title}
                releaseYear={item.releaseYear}
                type={item.type}
                posterUrl={item.posterUrl}
                bannerUrl={item.bannerUrl}
                abstractScore={item.abstractScore}
                preferredType="backdrop"
                aspectRatio="landscape"
                sizes="(max-width: 768px) 100vw, 50vw"
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-[#111111]/85 backdrop-blur-xs text-white text-[11px] font-mono px-3 py-1 rounded-lg uppercase tracking-wider z-10">
                {item.moodTag || 'Editor Pick'}
              </div>
              <div className="absolute top-3 right-3 z-10">
                <AbstractScoreBadge score={item.abstractScore} size="sm" />
              </div>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center space-x-2 text-xs font-mono text-gray-500 mb-2 min-w-0">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 shrink-0">{item.type}</span>
                  <span className="shrink-0">•</span>
                  <span className="shrink-0">{item.releaseYear}</span>
                  <span className="shrink-0">•</span>
                  <span className="truncate min-w-0">Dir. {item.director}</span>
                </div>

                <h2 className="font-serif font-black text-xl sm:text-2xl text-gray-950 mb-3 break-words">
                  {item.title}
                </h2>

                <p className="font-news text-sm sm:text-base text-gray-700 leading-relaxed italic border-l-2 border-[#008CFF] pl-3 break-words">
                  &ldquo;{item.personalCommentary}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-600">
                <div className="flex items-center space-x-2 min-w-0">
                  <Tv className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">Stream on: <strong className="text-gray-900">{item.whereToWatch}</strong></span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
