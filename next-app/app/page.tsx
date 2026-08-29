import React from 'react';
import Link from 'next/link';
import { db } from '../lib/db';
import { AbstractScoreBadge } from '../components/ui/AbstractScoreBadge';
import { ReviewCard } from '../components/ui/ReviewCard';
import { ArrowRight, Sparkles, Film, Tv, Flame } from 'lucide-react';

import { generateWebSiteStructuredData } from '../lib/seo/structuredData';

export const revalidate = 3600; // ISR: revalidate every hour

export default async function HomePage() {
  const reviews = await db.getReviews(false);
  const latestTake = reviews.find((r) => r.isLatestTake) || reviews[0];
  const featuredReviews = reviews.filter((r) => r.id !== latestTake?.id).slice(0, 6);
  const websiteJsonLd = generateWebSiteStructuredData();

  return (
    <div className="space-y-16 py-8 md:py-12">
      {/* WebSite Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {/* Editorial Hero Take */}
      {latestTake && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#008CFF]/10 text-[#008CFF] rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-6">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Lead Editorial Take</span>
                  </div>

                  <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-gray-950 tracking-tight leading-tight mb-4">
                    <Link href={`/reviews/${latestTake.slug}`} className="hover:text-[#008CFF] transition-colors">
                      {latestTake.title}
                    </Link>
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-500 mb-6">
                    <span className="font-bold text-gray-900">{latestTake.releaseYear}</span>
                    <span>•</span>
                    <span>Directed by {latestTake.director}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">{latestTake.type}</span>
                  </div>

                  <p className="font-news text-lg md:text-xl text-gray-700 leading-relaxed italic mb-8 border-l-3 border-[#008CFF] pl-4">
                    "{latestTake.myTake}"
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-100">
                  <AbstractScoreBadge score={latestTake.abstractScore} size="lg" showDescriptor />
                  <Link
                    href={`/reviews/${latestTake.slug}`}
                    className="inline-flex items-center space-x-2 px-6 py-3.5 bg-[#111111] hover:bg-[#008CFF] text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    <span>Read Full Critique</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full bg-gray-100">
                <img
                  src={latestTake.bannerUrl || latestTake.posterUrl}
                  alt={latestTake.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Reviews Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200/80">
          <div>
            <h2 className="font-serif font-black text-2xl md:text-3xl text-gray-900 tracking-tight">
              Recent Critical Takes
            </h2>
            <p className="font-mono text-xs text-gray-500 mt-1">
              Unfiltered, authoritative reviews from the cinema archives.
            </p>
          </div>

          <Link
            href="/movies"
            className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#008CFF] hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </div>
  );
}
