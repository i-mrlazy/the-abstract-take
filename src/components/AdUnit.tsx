import React from 'react';
import { Heart, ExternalLink, ShieldCheck, Sparkles, Film } from 'lucide-react';

interface AdUnitProps {
  type: 'ad-sense' | 'mubi-affiliate' | 'buy-coffee' | 'merch-promo' | 'editorial-promo';
  className?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ type, className = '' }) => {
  if (type === 'ad-sense') {
    return (
      <div className={`p-5 bg-white border border-gray-200/90 rounded-2xl text-center shadow-sm font-sans ${className}`}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
          Sponsor / Advertisement
        </div>
        <div className="py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-xs font-semibold text-gray-500">
          [ Google AdSense Responsive Banner Slot ]
        </div>
      </div>
    );
  }

  if (type === 'mubi-affiliate') {
    return (
      <div className={`p-6 bg-white border border-gray-200/90 rounded-2xl shadow-sm hover:shadow-lg transition-all font-sans space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="bg-[#008CFF] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-xs">
            Partner Offer
          </span>
          <span className="text-[11px] text-gray-400 font-medium">Sponsored</span>
        </div>
        <div>
          <h4 className="font-extrabold text-lg text-[#111111]">Experience Handpicked Cinema on MUBI</h4>
          <p className="text-xs font-news text-gray-600 mt-1 leading-relaxed">
            Get 30 days of elevated cinema for free. Streaming great films from visionary directors.
          </p>
        </div>
        <a
          href="https://mubi.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center space-x-2 w-full bg-[#008CFF] hover:bg-[#0077dd] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-all hover:-translate-y-0.5"
        >
          <span>Claim 30 Days Free on MUBI</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  if (type === 'buy-coffee') {
    return (
      <div className={`p-6 bg-white border border-amber-200/80 rounded-2xl shadow-sm hover:shadow-lg transition-all font-sans space-y-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
            <Heart className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <h4 className="font-extrabold text-base text-[#111111]">Fuel Independent Cinema Critique</h4>
        </div>
        <p className="text-xs font-news text-gray-600 leading-relaxed">
          The Abstract Take operates without paywalls or invasive popups. If our essays or watchlists helped you discover a film, consider buying us a coffee.
        </p>
        <a
          href="https://buymeacoffee.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center space-x-2 w-full bg-[#111111] hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-all hover:-translate-y-0.5"
        >
          <span>Support The Abstract Take ($5)</span>
          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
        </a>
      </div>
    );
  }

  if (type === 'editorial-promo' || type === 'merch-promo') {
    return (
      <div className={`p-6 bg-white border border-gray-200/90 rounded-2xl shadow-sm hover:shadow-lg transition-all font-sans space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50 rounded-lg text-[#008CFF]">
              <Film className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#008CFF]">
              Cinema Dispatch
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-bold">
            Weekly Take
          </span>
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-[#111111]">The Abstract Dispatch</h3>
          <p className="text-xs font-news text-gray-600 mt-1 leading-relaxed">
            Thoughtful cinematic essays, hidden gem discoveries, and uncensored critique delivered straight to your reading feed.
          </p>
        </div>
        <div className="inline-flex items-center justify-center space-x-2 w-full bg-gray-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00C0FF]" />
          <span>100% Independent & Uncompromised</span>
        </div>
      </div>
    );
  }

  return null;
};
