import React from 'react';
import type { Metadata } from 'next';
import { RATING_SCALE } from '@/lib/utils/rating';
import { ShieldCheck, Compass, Award, Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About The Abstract Take & The Abstract Scale',
  description: 'The editorial philosophy, critical standards, and signature 1–10 rating scale of The Abstract Take.',
  alternates: {
    canonical: 'https://theabstracttake.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
      {/* Header */}
      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="inline-block px-3 py-1 bg-[#008CFF]/10 text-[#008CFF] rounded-full text-xs font-mono font-bold uppercase tracking-wider">
          Editorial Philosophy
        </span>
        <h1 className="font-serif font-black text-4xl sm:text-5xl text-gray-950 tracking-tight">
          THE ABSTRACT TAKE
        </h1>
        <p className="font-news text-lg text-gray-600 leading-relaxed">
          An independent digital publication dedicated to uncompromising cinema critique, long-form television essays, and creator-curated recommendations.
        </p>
      </header>

      {/* Manifesto */}
      <section className="bg-white border border-gray-200/90 rounded-3xl p-8 sm:p-10 shadow-xs space-y-6">
        <h2 className="font-serif font-black text-2xl text-gray-950 border-b border-gray-100 pb-4">
          The Critical Manifesto
        </h2>

        <div className="font-news text-base sm:text-lg text-gray-800 leading-relaxed space-y-4">
          <p>
            In an entertainment landscape dominated by aggregated consensus, marketing soundbites, and algorithmic feeds, <em>The Abstract Take</em> exists to champion singular, opinionated, and artistic cinema criticism.
          </p>
          <p>
            Every critique on this platform reflects the creator's genuine, unfiltered experience. We do not adjust scores to align with internet consensus or studio buzz. Our highest allegiance is always to the craft of storytelling, thematic ambition, and directorial vision.
          </p>
          <p>
            Whether dissecting an auteur arthouse masterpiece, a major theatrical blockbuster, a prestige television season, or landmark anime, our reviews provide clear analytical clarity with an authentic voice.
          </p>
        </div>
      </section>

      {/* The Abstract Score System */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-[#008CFF] uppercase">
            Signature Scale
          </span>
          <h2 className="font-serif font-black text-3xl text-gray-950">The Abstract Scale</h2>
          <p className="font-news text-base text-gray-600 leading-relaxed">
            The Abstract Score is a signature personal editorial judgment on a strict 1 to 10 scale.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RATING_SCALE.map((rating) => (
            <div
              key={rating.score}
              className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:border-[#008CFF]/40 transition-colors flex items-start space-x-4"
            >
              <div
                className={`w-11 h-11 rounded-xl border flex items-center justify-center font-serif font-black text-lg shrink-0 ${rating.color.bg} ${rating.color.text} ${rating.color.border}`}
              >
                {rating.score}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-mono text-sm font-bold text-gray-950 uppercase tracking-wider">
                    {rating.descriptor}
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">({rating.score}/10)</span>
                </div>
                <p className="font-news text-xs text-gray-600 leading-relaxed">
                  {rating.meaning}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Standards */}
      <section className="bg-gray-50 border border-gray-200 rounded-3xl p-8 sm:p-10 space-y-6">
        <h2 className="font-serif font-black text-2xl text-gray-950 border-b border-gray-200 pb-4">
          Editorial Independence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-news text-sm text-gray-700">
          <div className="space-y-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-950">
              1. Authoritative Take
            </h3>
            <p>
              The creator's opinion is the supreme authority on every review. Ratings are never swayed by outside pressure.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-950">
              2. Factual Accuracy
            </h3>
            <p>
              All production details, director credits, release years, cast listings, and quotes are rigorously verified.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-950">
              3. Independent Judgment
            </h3>
            <p>
              We do not accept paid reviews or sponsored ratings. Every Abstract Score is an authentic critical evaluation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
