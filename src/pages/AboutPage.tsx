import React from 'react';
import { ShieldCheck, Compass, Heart, Film, Diamond, CheckCircle2, Award, Info, Sparkles } from 'lucide-react';
import { RATING_SCALE } from '../utils/rating';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-12 space-y-12 bg-[#FAF9F6] text-left">
      {/* Hero Header */}
      <div className="bg-white border border-gray-200/90 p-8 sm:p-12 rounded-2xl shadow-sm space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#008CFF] text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-md border border-blue-100">
          <ShieldCheck className="w-4 h-4 text-[#008CFF]" />
          <span>EDITORIAL IDENTITY & ETHOS</span>
        </div>
        <h1 className="font-serif font-black text-3xl sm:text-5xl lg:text-6xl text-[#111111] tracking-tight">
          About The Abstract Take
        </h1>
        <p className="font-news text-lg sm:text-xl text-gray-700 font-medium leading-relaxed max-w-4xl">
          The Abstract Take is an independent editorial review publication and cinema companion—an unfiltered home for thoughtful critique, personal opinions, and curated watchlists across movies, series, and anime.
        </p>
      </div>

      {/* Editorial Pillars */}
      <section className="space-y-6">
        <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#111111] border-b border-gray-200 pb-3">
          Editorial Pillars & Formats
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Critical Reviews & Essays */}
          <div className="p-6 sm:p-8 bg-white border border-gray-200/90 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Film className="w-6 h-6 text-[#008CFF]" />
              <h3 className="font-serif font-black text-xl text-[#111111]">In-Depth Critical Essays</h3>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#008CFF] block">
              REVIEWS & EDITORIAL TAKES
            </span>
            <p className="text-xs font-news text-gray-600 leading-relaxed">
              Personal written critiques, authoritative 1–10 Abstract Scores, spoiler breakdowns, and deep scene analyses exploring visual storytelling and auteur vision.
            </p>
          </div>

          {/* Curated Recommendations */}
          <div className="p-6 sm:p-8 bg-white border border-gray-200/90 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-cyan-500" />
              <h3 className="font-serif font-black text-xl text-[#111111]">Curated Watchlists</h3>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-cyan-600 block">
              THE ABSTRACT RECOMMENDS
            </span>
            <p className="text-xs font-news text-gray-600 leading-relaxed">
              Handpicked thematic collections, hidden gems, weekend watchlists, and smart discovery matching genuine cinematic taste.
            </p>
          </div>
        </div>
      </section>

      {/* The Official 1 to 10 Scale & Word Descriptor Mapping */}
      <section className="bg-white border border-gray-200/90 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
        <div className="space-y-2 border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-50 text-[#008CFF] text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-blue-100">
              SIGNATURE EDITORIAL PHILOSOPHY
            </span>
            <span className="text-xs font-mono font-bold text-gray-400 uppercase">THE ABSTRACT SCORE</span>
          </div>
          <h2 className="font-serif font-black text-2xl sm:text-4xl text-[#111111]">
            The Abstract Score & Editorial Benchmark
          </h2>
          <p className="text-sm font-news text-gray-600 leading-relaxed max-w-3xl">
            The Abstract Score is not an algorithm, statistical aggregate, or mechanical formula. It is an uncompromising personal editorial judgment after experiencing the complete work—measuring artistic resonance, direction, narrative boldness, and lasting emotional weight.
          </p>
        </div>

        {/* Detailed Table & Cards View */}
        <div className="overflow-hidden border border-gray-200 rounded-xl shadow-2xs">
          <div className="hidden sm:grid sm:grid-cols-12 bg-gray-900 text-white font-mono font-bold text-xs uppercase tracking-wider p-3.5 border-b border-gray-200">
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-3">Descriptor</div>
            <div className="col-span-7">Editorial Meaning & Benchmark</div>
          </div>

          <div className="divide-y divide-gray-100 bg-white">
            {RATING_SCALE.map((tier) => (
              <div
                key={tier.score}
                className="grid grid-cols-1 sm:grid-cols-12 items-center p-4 sm:p-3.5 gap-2 sm:gap-4 hover:bg-gray-50/70 transition-colors"
              >
                {/* Score Number Badge */}
                <div className="col-span-2 flex items-center sm:justify-center">
                  <div className={`w-12 h-10 rounded-lg flex items-center justify-center font-mono font-black text-base shadow-2xs ${tier.color.bg} ${tier.color.text}`}>
                    {tier.score}
                  </div>
                  <span className="sm:hidden ml-3 font-serif font-black text-lg text-[#111111]">
                    {tier.descriptor}
                  </span>
                </div>

                {/* Descriptor */}
                <div className="hidden sm:block col-span-3">
                  <span className={`inline-block font-sans font-bold text-xs uppercase px-2.5 py-1 rounded-md ${tier.color.badgeBg} ${tier.color.badgeText}`}>
                    {tier.descriptor}
                  </span>
                </div>

                {/* Meaning */}
                <div className="col-span-7 text-xs sm:text-sm font-news text-gray-700 leading-snug">
                  {tier.meaning}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50/80 border border-gray-200 p-4 rounded-xl flex items-start space-x-3 text-xs font-news text-gray-700">
          <Info className="w-5 h-5 text-[#008CFF] flex-shrink-0 mt-0.5" />
          <p>
            <strong>Critical Perspective:</strong> A score of 7 ("Good") or 8 ("Amazing") represents an enthusiastic endorsement. Scores of 9 ("Brilliant") and 10 ("Masterpiece") are reserved exclusively for rare cinematic achievements that endure well past initial viewing.
          </p>
        </div>
      </section>

      {/* Editorial Independence */}
      <section className="p-6 sm:p-8 bg-white border border-gray-200/90 rounded-2xl shadow-sm space-y-3">
        <h3 className="font-serif font-black text-xl text-[#111111]">
          Editorial Independence & Ethics
        </h3>
        <p className="text-xs font-news text-gray-600 leading-relaxed">
          The Abstract Take is 100% creator-owned and independently run. Reviews reflect genuine reactions without corporate sponsor inflation, studio interference, or algorithmic compromise.
        </p>
      </section>
    </div>
  );
};
