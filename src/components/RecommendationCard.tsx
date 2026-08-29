import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RecommendationList } from '../types';
import { Compass, ArrowRight, Sparkles } from 'lucide-react';
import { normalizeScore, getQualityLabel } from '../utils/rating';

interface RecommendationCardProps {
  list: RecommendationList;
  onSelect?: (list: RecommendationList) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ list, onSelect }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSelect) {
      onSelect(list);
    }
    navigate(`/recommends/${list.slug || list.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      onClick={handleClick}
      className="rounded-2xl overflow-hidden cursor-pointer group bg-white flex flex-col justify-between h-full border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-200 text-left"
    >
      <div>
        {/* Cover Header */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-900">
          <img
            src={list.coverUrl}
            alt={list.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          <div className="absolute top-3 left-3">
            <span className="bg-[#008CFF] text-white text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
              {list.category}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white text-left">
            <div className="text-[10px] font-mono font-bold uppercase text-[#008CFF] tracking-widest flex items-center space-x-1 mb-1">
              <Compass className="w-3 h-3 text-[#008CFF]" />
              <span className="text-white">THE ABSTRACT RECOMMENDS</span>
            </div>
            <h3 className="font-serif font-black text-xl leading-tight line-clamp-1 text-white">
              {list.title}
            </h3>
          </div>
        </div>

        {/* List Body */}
        <div className="p-5 space-y-3 text-left">
          <p className="text-xs font-news text-gray-700 leading-relaxed line-clamp-2 italic">
            "{list.subtitle}"
          </p>

          {/* Film Thumbnails Preview */}
          <div className="pt-2">
            <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
              {list.items.length} Curated Titles:
            </div>
            <div className="grid grid-cols-3 gap-2">
              {list.items.slice(0, 3).map((item) => {
                const s = normalizeScore(item.abstractScore);
                const q = getQualityLabel(s);
                return (
                  <div key={item.id} className="bg-gray-50 border border-gray-200/80 p-2 rounded-lg text-center shadow-2xs">
                    <div className="text-[10px] font-sans font-bold text-[#111111] truncate">{item.title}</div>
                    <div className="text-[9px] font-mono text-[#008CFF] font-black mt-0.5">
                      {s}/10 · {q}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs font-sans">
        <div className="flex items-center space-x-1.5 text-gray-600 text-[11px] font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#008CFF]" />
          <span>Personally Recommended</span>
        </div>

        <span className="font-black text-[#008CFF] flex items-center space-x-1 group-hover:underline">
          <span>View List</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
