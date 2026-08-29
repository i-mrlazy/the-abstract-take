import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Sparkles, ArrowRight, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'The Abstract Recommends — Curated Cinema Watchlists',
  description: 'Curated, themed watchlists handpicked by The Abstract Take. From modern neo-noir to mind-bending sci-fi masterpieces.',
  alternates: {
    canonical: 'https://theabstracttake.com/recommends',
  },
};

export const revalidate = 3600;

export default async function RecommendsListPage() {
  const lists = await db.getRecommendationLists();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Header */}
      <header className="border-b border-gray-200/80 pb-6">
        <span className="inline-block px-3 py-1 bg-[#008CFF]/10 text-[#008CFF] rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-3">
          Editorial Collections
        </span>
        <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-gray-950 tracking-tight">
          The Abstract Recommends
        </h1>
        <p className="font-news text-base sm:text-lg text-gray-600 max-w-2xl mt-2 leading-relaxed">
          Themed cinematic journeys, definitive genre canons, and bespoke double-features curated strictly on artistic merit.
        </p>
      </header>

      {/* Grid of Recommendation Collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lists.map((list) => (
          <article
            key={list.id}
            className="group bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-xs hover:border-[#008CFF]/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <Link href={`/recommends/${list.slug || list.id}`} className="block relative aspect-16/10 bg-gray-100 overflow-hidden">
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
    </div>
  );
}
