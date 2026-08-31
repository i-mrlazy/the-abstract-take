import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '../lib/db';
import { AbstractScoreBadge } from '../components/ui/AbstractScoreBadge';
import { ReviewCard } from '../components/ui/ReviewCard';
import { ReviewArtwork } from '../components/ui/ReviewArtwork';
import { BookmarkButton } from '../components/bookmarks/BookmarkButton';
import { normalizeScore } from '../lib/utils/rating';
import {
  ArrowRight,
  Compass,
  Clapperboard,
  Diamond,
  Layers,
  Sparkles,
} from 'lucide-react';
import { generateWebSiteStructuredData } from '../lib/seo/structuredData';

export const revalidate = 3600; // ISR: revalidate every hour

export default async function HomePage() {
  const reviews = await db.getReviews(false);
  const recommendationLists = await db.getRecommendationLists(false);

  const latestTake = reviews.find((r) => r.isLatestTake) || reviews[0];
  const featuredTakes = reviews.filter((r) => r.id !== latestTake?.id).slice(0, 3);
  const recentReviews = reviews.filter((r) => r.id !== latestTake?.id);
  const masterpieces = reviews.filter((r) => normalizeScore(r.abstractScore) >= 9);

  const websiteJsonLd = generateWebSiteStructuredData();

  return (
    <div className="space-y-12 sm:space-y-16 pb-20 bg-[#FAF9F6] text-left">
      {/* WebSite Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* 1. Large Editorial Statement Hero */}
      <section className="bg-abstract-gradient-hero border-b border-gray-200/80 py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-6 text-left relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur border border-gray-200/80 text-[#111111] px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#008CFF] animate-pulse shrink-0" />
            <span className="text-[#008CFF] truncate">PERSONAL CINEMATIC ESSAYS & REVIEWS</span>
          </div>

          <div className="space-y-3 max-w-4xl">
            <h1 className="font-serif font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#111111] leading-[1.08] tracking-tight break-words">
              MY TAKE ON WHAT’S <br className="hidden sm:inline" />
              <span className="underline decoration-[#00C0FF] decoration-4 sm:decoration-8 underline-offset-4 sm:underline-offset-8">
                WORTH WATCHING.
              </span>
            </h1>
            <p className="font-news text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed pt-2 max-w-3xl font-medium">
              Honest, unfiltered opinions on cinema, television, anime, and documentaries. No corporate ratings, no algorithmic fluff—just my personal verdict on what’s worth your time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {latestTake && (
              <Link
                href={`/reviews/${latestTake.slug}`}
                className="bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider px-5 sm:px-6 py-3.5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
              >
                <span>Read My Latest Take</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              href="/reviews"
              className="bg-white hover:bg-gray-50 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider px-5 sm:px-6 py-3.5 border border-gray-200/90 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer shrink-0"
            >
              Explore All Reviews
            </Link>

            <Link
              href="/recommends"
              className="bg-white hover:bg-gray-50 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider px-5 sm:px-6 py-3.5 border border-gray-200/90 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
            >
              <Compass className="w-4 h-4 text-[#008CFF]" />
              <span>The Abstract Recommends</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Latest Take (Flagship Lead Review) & Responsively Balanced Featured Takes */}
      {latestTake && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Lead Editorial Review Card (8 columns on Desktop) */}
            <div className="lg:col-span-8 bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-7 md:p-8 shadow-sm hover:shadow-md transition-all space-y-6 text-left min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
                  <span className="bg-[#008CFF] text-white px-3 py-1 rounded-lg text-xs font-mono font-black uppercase tracking-wider shadow-xs shrink-0">
                    LATEST TAKE
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-500 uppercase truncate">
                    {latestTake.type} • {latestTake.releaseYear} • DIR. {latestTake.director}
                  </span>
                </div>
                <AbstractScoreBadge score={latestTake.abstractScore} size="md" />
              </div>

              <h2 className="font-serif font-black text-2xl sm:text-4xl md:text-5xl text-[#111111] leading-tight hover:text-[#008CFF] transition-colors break-words">
                <Link href={`/reviews/${latestTake.slug}`}>{latestTake.title}</Link>
              </h2>

              {/* Main Image Banner - LCP Priority */}
              <Link
                href={`/reviews/${latestTake.slug}`}
                className="block relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-gray-100 cursor-pointer group bg-gray-900 shadow-sm"
              >
                <ReviewArtwork
                  title={latestTake.title}
                  releaseYear={latestTake.releaseYear}
                  type={latestTake.type}
                  slug={latestTake.slug}
                  posterUrl={latestTake.posterUrl}
                  bannerUrl={latestTake.bannerUrl}
                  artwork={latestTake.artwork}
                  abstractScore={latestTake.abstractScore}
                  preferredType="backdrop"
                  aspectRatio="landscape"
                  priority={true}
                  sizes="(max-width: 1024px) 100vw, 840px"
                  alt={latestTake.bannerAlt || latestTake.title}
                  className="w-full h-full group-hover:scale-102 transition-transform duration-500 opacity-95"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white font-mono text-[10px] sm:text-xs font-bold uppercase px-2.5 py-1 rounded-lg border border-white/10 shadow-xs max-w-[80%] truncate">
                  {latestTake.runtime} • {latestTake.genres?.join(', ')}
                </div>
                <div className="absolute bottom-3 right-3">
                  <AbstractScoreBadge score={latestTake.abstractScore} size="sm" />
                </div>
              </Link>

              {/* Creator's Thesis Statement */}
              <div className="bg-blue-50/40 border-l-4 border-l-[#008CFF] border-y border-r border-blue-100/60 p-4 sm:p-5 rounded-r-xl space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-black tracking-widest text-[#008CFF] block">
                  MY TAKE
                </span>
                <p className="font-news text-base sm:text-lg text-gray-900 leading-relaxed italic break-words">
                  &ldquo;{latestTake.myTake || latestTake.verdictText}&rdquo;
                </p>
              </div>

              {/* Quick Pros / Cons Snapshot (if available) */}
              {(latestTake.pros?.length > 0 || latestTake.cons?.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {latestTake.pros?.length > 0 && (
                    <div className="bg-emerald-50/50 border border-emerald-200/80 p-3.5 rounded-xl text-xs space-y-1 shadow-2xs">
                      <span className="font-mono font-bold text-emerald-800 uppercase tracking-wider block">
                        What Worked:
                      </span>
                      <p className="text-emerald-950 font-news leading-relaxed">{latestTake.pros[0]}</p>
                    </div>
                  )}
                  {latestTake.cons?.length > 0 && (
                    <div className="bg-orange-50/50 border border-orange-200/80 p-3.5 rounded-xl text-xs space-y-1 shadow-2xs">
                      <span className="font-mono font-bold text-orange-800 uppercase tracking-wider block">
                        What Didn&apos;t:
                      </span>
                      <p className="text-orange-950 font-news leading-relaxed">{latestTake.cons[0]}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <Link
                  href={`/reviews/${latestTake.slug}`}
                  className="bg-[#111111] hover:bg-[#008CFF] text-white font-sans font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <span>Read My Full Review</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <BookmarkButton reviewId={latestTake.id} variant="button" />
              </div>
            </div>

            {/* Right Column: Responsively Balanced Featured Takes Module (4 cols on Desktop, full on Mobile/Tablet) */}
            <div className="lg:col-span-4 space-y-6 min-w-0">
              <div className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-left min-w-0">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#008CFF]" />
                    <h3 className="font-mono font-black text-xs uppercase tracking-widest text-[#111111]">
                      FEATURED TAKES
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#008CFF] font-bold uppercase tracking-wider">
                    RECENT REVIEWS
                  </span>
                </div>

                <div className="space-y-4 divide-y divide-gray-100">
                  {featuredTakes.map((rev) => (
                    <Link
                      key={rev.id}
                      href={`/reviews/${rev.slug}`}
                      className="pt-4 first:pt-0 flex gap-3.5 sm:gap-4 cursor-pointer group items-start min-w-0"
                    >
                      {/* Responsive Poster with preserved 2:3 aspect ratio */}
                      <div className="w-20 sm:w-24 shrink-0 aspect-[2/3] rounded-xl overflow-hidden border border-gray-200/80 bg-gray-900 relative shadow-2xs group-hover:scale-103 transition-transform duration-300">
                        <ReviewArtwork
                          title={rev.title}
                          releaseYear={rev.releaseYear}
                          type={rev.type}
                          slug={rev.slug}
                          posterUrl={rev.posterUrl}
                          bannerUrl={rev.bannerUrl}
                          artwork={rev.artwork}
                          abstractScore={rev.abstractScore}
                          preferredType="poster"
                          aspectRatio="portrait"
                          alt={rev.posterAlt || rev.title}
                          sizes="(max-width: 640px) 80px, 96px"
                          className="w-full h-full"
                        />
                      </div>

                      {/* Content Area with full multi-line resilience */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase font-black text-[#008CFF] tracking-wider shrink-0">
                            {rev.type}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200/80 shrink-0">
                            {normalizeScore(rev.abstractScore)}/10
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#111111] group-hover:text-[#008CFF] transition-colors leading-snug line-clamp-2 break-words">
                          {rev.title}
                        </h4>

                        <div className="text-[11px] font-mono text-gray-400">
                          {rev.releaseYear} • Dir. {rev.director}
                        </div>

                        <p className="text-xs font-news text-gray-600 line-clamp-2 italic leading-relaxed pt-0.5">
                          &ldquo;{rev.myTake || rev.verdictText}&rdquo;
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                <Link
                  href="/reviews"
                  className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider rounded-xl border border-gray-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer block text-center mt-2"
                >
                  <span>Browse All Takes Archive</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. The Abstract Recommends (Curated Watchlists Preview) */}
      {recommendationLists.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-4">
            <div className="space-y-1 text-left">
              <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold uppercase text-[#008CFF] tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                <span>THE ABSTRACT RECOMMENDS</span>
              </div>
              <h2 className="font-serif font-black text-2xl sm:text-4xl text-[#111111]">
                Curated Thematic Watchlists
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm font-news">
                Thematic lists, weekend watches, and deep-dive cinema collections.
              </p>
            </div>

            <Link
              href="/recommends"
              className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-[#008CFF] hover:text-[#0077dd] uppercase tracking-wider transition-colors cursor-pointer shrink-0"
            >
              <span>View All Collections</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendationLists.slice(0, 3).map((list) => (
              <article
                key={list.id}
                className="group bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-xs hover:border-[#008CFF]/50 hover:shadow-md transition-all flex flex-col justify-between min-w-0"
              >
                <Link
                  href={`/recommends/${list.slug || list.id}`}
                  className="block relative aspect-[16/10] bg-gray-900 overflow-hidden"
                >
                  <Image
                    src={list.coverUrl}
                    alt={list.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#111111]/85 backdrop-blur-xs text-white text-[11px] font-mono px-3 py-1 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 z-10">
                    <Layers className="w-3.5 h-3.5 text-[#008CFF]" />
                    <span>{list.items?.length || 0} Picks</span>
                  </div>
                </Link>

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#008CFF] uppercase">
                      {list.category}
                    </span>
                    <h3 className="font-serif font-black text-xl text-gray-950 mt-1 mb-2 group-hover:text-[#008CFF] transition-colors leading-snug line-clamp-2 break-words">
                      <Link href={`/recommends/${list.slug || list.id}`}>{list.title}</Link>
                    </h3>
                    <p className="font-news text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {list.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-500 truncate">Curated by {list.curatorName}</span>
                    <span className="font-bold text-[#008CFF] flex items-center space-x-1 group-hover:underline shrink-0">
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 4. Complete Takes Feed with Format Filter Pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold uppercase text-[#008CFF] tracking-wider">
              <Clapperboard className="w-3.5 h-3.5" />
              <span>RECENT EDITORIAL ESSAYS</span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-4xl text-[#111111]">
              Latest Takes Feed
            </h2>
          </div>

          {/* Quick Format Filter Shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href="/movies"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all"
            >
              Movies
            </Link>
            <Link
              href="/series"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all"
            >
              Series
            </Link>
            <Link
              href="/anime"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all"
            >
              Anime
            </Link>
            <Link
              href="/documentaries"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all"
            >
              Documentaries
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {recentReviews.slice(0, 6).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        <div className="text-center pt-6">
          <Link
            href="/reviews"
            className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider px-8 py-3.5 border border-gray-300 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <span>Explore Complete Archive ({reviews.length} Takes)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 5. Signature Masterpieces Showcase (Score 9 & 10) */}
      {masterpieces.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm space-y-6 text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold uppercase text-[#008CFF] tracking-wider">
                  <Diamond className="w-3.5 h-3.5" />
                  <span>SIGNATURE TIER</span>
                </div>
                <h2 className="font-serif font-black text-2xl sm:text-4xl text-[#111111]">
                  Personal Favorites & Masterpieces
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm font-news">
                  Titles with an Abstract Score of 9 or 10 that have shaped my cinematic worldview.
                </p>
              </div>

              <Link
                href="/reviews?minScore=9"
                className="bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 self-start sm:self-center"
              >
                View Masterpieces
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {masterpieces.slice(0, 3).map((rev) => {
                const score = normalizeScore(rev.abstractScore);
                return (
                  <Link
                    key={rev.id}
                    href={`/reviews/${rev.slug}`}
                    className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-4 cursor-pointer group hover:border-[#008CFF] hover:bg-white hover:shadow-lg transition-all space-y-3 block min-w-0"
                  >
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-gray-900 border border-gray-100 shadow-2xs">
                      <ReviewArtwork
                        title={rev.title}
                        releaseYear={rev.releaseYear}
                        type={rev.type}
                        slug={rev.slug}
                        posterUrl={rev.posterUrl}
                        bannerUrl={rev.bannerUrl}
                        artwork={rev.artwork}
                        abstractScore={rev.abstractScore}
                        preferredType="backdrop"
                        aspectRatio="landscape"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        alt={rev.bannerAlt || rev.title}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <div className="absolute top-2 left-2 bg-[#008CFF] text-white text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded shadow-xs z-10">
                        SCORE {score}/10
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h3 className="font-serif font-black text-lg sm:text-xl text-[#111111] group-hover:text-[#008CFF] transition-colors line-clamp-2 break-words leading-snug">
                        {rev.title}
                      </h3>
                      <p className="text-xs font-mono text-gray-500 truncate">
                        Dir. {rev.director} ({rev.releaseYear})
                      </p>
                      <p className="text-xs font-news text-gray-700 line-clamp-2 pt-1 italic leading-relaxed">
                        &ldquo;{rev.myTake || rev.verdictText}&rdquo;
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
