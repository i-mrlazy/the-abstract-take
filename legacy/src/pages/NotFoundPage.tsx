import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ArrowLeft, Compass, Clapperboard, Sparkles } from 'lucide-react';

interface NotFoundPageProps {
  message?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  message = "The reel you're looking for was either moved, deleted, or never made the final cut.",
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-[#FAF9F6] text-center">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Brand Badge */}
        <div className="inline-flex items-center space-x-2 bg-white border border-gray-200 text-[#111111] px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>404 — SCENE MISSING</span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="font-serif font-black text-5xl sm:text-7xl md:text-8xl text-[#111111] tracking-tight leading-none">
            NOTHING TO <br />
            <span className="underline decoration-[#00C0FF] decoration-8 underline-offset-8">TAKE HERE.</span>
          </h1>
          <p className="font-news text-lg sm:text-xl text-gray-700 max-w-lg mx-auto font-medium leading-relaxed pt-2">
            {message}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/"
            className="bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <Link
            to="/reviews"
            className="bg-white hover:bg-gray-50 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider px-6 py-3.5 border border-gray-200/90 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center space-x-2"
          >
            <Film className="w-4 h-4 text-[#008CFF]" />
            <span>Explore All Reviews</span>
          </Link>

          <Link
            to="/recommends"
            className="bg-white hover:bg-gray-50 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider px-6 py-3.5 border border-gray-200/90 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center space-x-2"
          >
            <Compass className="w-4 h-4 text-[#008CFF]" />
            <span>Curated Watchlists</span>
          </Link>
        </div>

        {/* Decorative Quote */}
        <div className="pt-8 border-t border-gray-200/80">
          <p className="font-serif italic text-sm text-gray-500">
            “In cinema, as in life, sometimes the most profound sequences end up on the cutting room floor.”
          </p>
          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 block mt-1">
            — The Abstract Take Editorial
          </span>
        </div>
      </div>
    </div>
  );
};
