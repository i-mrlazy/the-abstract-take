import React, { useState, useEffect } from 'react';
import { WhatToWatchNextItem } from '../types';
import { api } from '../utils/api';
import { AbstractScoreBadge } from '../components/AbstractScoreBadge';
import { Compass, Sparkles, Filter, Tv, ArrowRight, Clock, Film } from 'lucide-react';
import { normalizeScore, getQualityLabel } from '../utils/rating';

export const WhatToWatchNextPage: React.FC = () => {
  const [items, setItems] = useState<WhatToWatchNextItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMood, setSelectedMood] = useState<string>('All');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    api.getWhatToWatchItems()
      .then((data) => setItems(data))
      .catch((err) => console.error('Failed to load what to watch items:', err))
      .finally(() => setLoading(false));
  }, []);

  const moods = ['All', 'Late Night Contemplation', 'Existential Sci-Fi', 'Adrenaline Rush', 'Feel Good Masterpieces', 'Atmospheric Crime'];

  const filtered = selectedMood === 'All'
    ? items
    : items.filter((item) => item.moodTag.toLowerCase().includes(selectedMood.toLowerCase()) || item.moodTag === selectedMood);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-[#FAF9F6] text-left">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200/90 p-8 sm:p-10 rounded-2xl shadow-sm space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#008CFF] text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-md border border-blue-100">
          <Sparkles className="w-4 h-4 text-[#008CFF]" />
          <span>INSTANT EDITORIAL CURATION</span>
        </div>

        <h1 className="font-serif font-black text-3xl sm:text-5xl text-[#111111] tracking-tight">
          What to Watch Next
        </h1>

        <p className="font-news text-base sm:text-lg text-gray-700 font-medium max-w-2xl leading-relaxed">
          Quick editorial recommendations for right now. Zero algorithmic guessing—just curated picks mapped to specific moods, vibes, and streaming platforms.
        </p>
      </div>

      {/* Mood Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">
        <span className="font-mono font-bold text-xs uppercase tracking-wider text-gray-400 mr-2 flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-[#008CFF]" />
          <span>MOOD / VIBE:</span>
        </span>
        {moods.map((mood) => (
          <button
            key={mood}
            onClick={() => setSelectedMood(mood)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all border cursor-pointer ${
              selectedMood === mood
                ? 'bg-[#008CFF] text-white border-[#008CFF] shadow-2xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {mood}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-6 bg-white border border-gray-200/90 rounded-2xl shadow-sm hover:shadow-md hover:border-[#008CFF]/50 transition-all flex flex-col sm:flex-row gap-6"
          >
            <img
              src={item.posterUrl}
              alt={item.title}
              className="w-32 aspect-[2/3] object-cover rounded-xl border border-gray-200 shrink-0 shadow-xs"
            />
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase bg-gray-900 text-white px-2 py-0.5 rounded">
                      {item.type}
                    </span>
                    <span className="text-xs font-mono text-gray-500">{item.releaseYear}</span>
                  </div>
                  <AbstractScoreBadge score={item.abstractScore} size="sm" />
                </div>

                <h3 className="font-serif font-black text-xl text-[#111111] pt-2">
                  {item.title}
                </h3>
                <span className="text-[10px] font-mono font-bold text-[#008CFF] uppercase tracking-wider block">
                  Mood: {item.moodTag}
                </span>

                <p className="font-news text-xs text-gray-700 leading-relaxed italic pt-2">
                  "{item.personalCommentary}"
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-600">
                <span>
                  <strong>Stream on:</strong> {item.whereToWatch}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
