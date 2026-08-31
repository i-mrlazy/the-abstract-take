import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { matchReviewsByCriteria } from '@/lib/editorial/recommendationEngine';
import { CuratorAiTrigger } from '@/components/ai/CuratorAiTrigger';
import { AbstractScoreBadge } from '@/components/ui/AbstractScoreBadge';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { Compass, ArrowRight, Layers, Sparkles, Film, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'The Abstract Recommends & Discovery Engine — The Abstract Take',
  description: 'Personalized watch recommendations, themed cinematic journeys, and definitive watchlists curated strictly on artistic merit.',
  alternates: {
    canonical: 'https://the-abstract-take.vercel.app/recommends',
  },
};

export const revalidate = 3600;

interface RecommendsPageProps {
  searchParams: Promise<{
    type?: string;
    genre?: string;
    mood?: string;
    q?: string;
  }>;
}

export default async function RecommendsPage({ searchParams }: RecommendsPageProps) {
  const params = await searchParams;
  const rawGenre = typeof params.genre === 'string' ? params.genre.trim() : '';
  const parsedGenres = rawGenre
    ? rawGenre.split(',').map((g) => g.trim()).filter(Boolean)
    : [];

  const rawType = typeof params.type === 'string' ? params.type.trim() : '';
  const rawMood = typeof params.mood === 'string' ? params.mood.trim() : '';
  const rawQ = typeof params.q === 'string' ? params.q.trim() : '';

  const hasCriteria = Boolean(rawType || parsedGenres.length > 0 || rawMood || rawQ);

  // If user navigated with criteria, calculate dynamic matches with hard filtering
  const matchResult = hasCriteria
    ? await matchReviewsByCriteria({
        mediaType: rawType,
        genres: parsedGenres,
        genre: parsedGenres[0] || undefined,
        mood: rawMood,
        favoriteFilms: rawQ,
      })
    : null;

  const allLists = await db.getRecommendationLists();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      {/* Dynamic Recommendation Mode */}
      {hasCriteria && matchResult ? (
        <section className="space-y-10">
          {/* Back & Criteria Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
            <Link
              href="/recommends"
              className="inline-flex items-center space-x-2 text-xs font-mono text-gray-500 hover:text-[#008CFF] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>VIEW ALL CURATED COLLECTIONS</span>
            </Link>

            <CuratorAiTrigger
              variant="pill"
              label="Modify Viewing Criteria"
            />
          </div>

          {/* Dynamic Editorial Headline & Context */}
          <header className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#008CFF]/10 text-[#008CFF] rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-[#008CFF]" />
              <span>YOUR NEXT TAKE</span>
            </div>

            <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-gray-950 tracking-tight">
              {matchResult.headline}
            </h1>

            <p className="font-news text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed italic border-l-2 border-[#008CFF] pl-4 py-1">
              &ldquo;{matchResult.contextNote}&rdquo;
            </p>
          </header>

          {/* Section 1: From The Abstract Take (Reviewed Titles) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2">
                <Film className="w-4 h-4 text-[#008CFF]" />
                <h2 className="font-serif font-black text-xl text-gray-900">
                  From The Abstract Take Archives
                </h2>
              </div>
              <span className="text-xs font-mono text-gray-500">
                {matchResult.reviewedMatches.length} Matches Found
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {matchResult.reviewedMatches.map((pick) => (
                <article
                  key={pick.id}
                  className="group bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-xs hover:border-[#008CFF]/50 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-16/10 bg-gray-100 overflow-hidden">
                    <Link href={`/reviews/${pick.slug}`} className="block w-full h-full">
                      <img
                        src={pick.posterUrl}
                        alt={pick.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                    <div className="absolute top-3 left-3 z-10">
                      <BookmarkButton reviewId={pick.id} size="sm" />
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <AbstractScoreBadge score={pick.abstractScore} size="sm" />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-[#111111]/85 backdrop-blur-xs text-white text-[11px] font-mono px-2.5 py-1 rounded-lg uppercase tracking-wider pointer-events-none">
                      {pick.type}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-mono text-gray-500 mb-1.5">
                        <span>{pick.releaseYear}</span>
                        <span>•</span>
                        <span className="truncate">Dir. {pick.director}</span>
                      </div>

                      <h3 className="font-serif font-black text-xl text-gray-950 group-hover:text-[#008CFF] transition-colors leading-snug">
                        <Link href={`/reviews/${pick.slug}`}>{pick.title}</Link>
                      </h3>

                      <p className="font-news text-sm text-gray-600 line-clamp-3 leading-relaxed mt-2">
                        {pick.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
                      <Link
                        href={`/reviews/${pick.slug}`}
                        className="font-bold text-[#008CFF] hover:underline flex items-center space-x-1"
                      >
                        <span>Read Full Critique</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Section 2: Matched Curated Collections */}
          {matchResult.collectionMatches.length > 0 && (
            <div className="space-y-6 pt-6">
              <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
                <Layers className="w-4 h-4 text-[#008CFF]" />
                <h2 className="font-serif font-black text-xl text-gray-900">
                  Explore Related Collections
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchResult.collectionMatches.map((list) => (
                  <article
                    key={list.id}
                    className="group bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-xs hover:border-[#008CFF]/50 transition-all flex flex-col justify-between"
                  >
                    <Link
                      href={`/recommends/${list.slug || list.id}`}
                      className="block relative aspect-16/10 bg-gray-100 overflow-hidden"
                    >
                      <img
                        src={list.coverUrl}
                        alt={list.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-[#111111]/85 backdrop-blur-xs text-white text-[11px] font-mono px-3 py-1 rounded-lg uppercase tracking-wider">
                        {list.items?.length || 0} Picks
                      </div>
                    </Link>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#008CFF] uppercase">
                          {list.category}
                        </span>
                        <h3 className="font-serif font-black text-lg text-gray-950 mt-1 mb-2 group-hover:text-[#008CFF] transition-colors leading-snug">
                          <Link href={`/recommends/${list.slug || list.id}`}>{list.title}</Link>
                        </h3>
                        <p className="font-news text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {list.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-500">By {list.curatorName}</span>
                        <Link
                          href={`/recommends/${list.slug || list.id}`}
                          className="font-bold text-[#008CFF] hover:underline flex items-center space-x-1"
                        >
                          <span>Explore List</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        /* Standard All Collections View */
        <section className="space-y-10">
          {/* Header */}
          <header className="border-b border-gray-200/80 pb-6 space-y-4">
            <span className="inline-block px-3 py-1 bg-[#008CFF]/10 text-[#008CFF] rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              Editorial Collections
            </span>
            <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-gray-950 tracking-tight">
              The Abstract Recommends
            </h1>
            <p className="font-news text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
              Themed cinematic journeys, definitive genre canons, and bespoke double-features curated strictly on artistic merit.
            </p>
            <div className="pt-2">
              <CuratorAiTrigger
                variant="banner"
                label="What Should I Watch Next? (Curator Engine)"
              />
            </div>
          </header>

          {/* Grid of Recommendation Collections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allLists.map((list) => (
              <article
                key={list.id}
                className="group bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-xs hover:border-[#008CFF]/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <Link
                  href={`/recommends/${list.slug || list.id}`}
                  className="block relative aspect-16/10 bg-gray-100 overflow-hidden"
                >
                  <img
                    src={list.coverUrl}
                    alt={list.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#111111]/85 backdrop-blur-xs text-white text-[11px] font-mono px-3 py-1 rounded-lg uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#008CFF]" />
                    <span>{list.items?.length || 0} Picks</span>
                  </div>
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#008CFF] uppercase">
                      {list.category}
                    </span>
                    <h2 className="font-serif font-black text-xl text-gray-950 mt-1 mb-2 group-hover:text-[#008CFF] transition-colors leading-snug">
                      <Link href={`/recommends/${list.slug || list.id}`}>{list.title}</Link>
                    </h2>
                    <p className="font-news text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {list.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-500">Curated by {list.curatorName}</span>
                    <span className="font-bold text-[#008CFF] flex items-center space-x-1 group-hover:underline">
                      <span>Explore List</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
