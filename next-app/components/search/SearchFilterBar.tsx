'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface SearchFilterBarProps {
  initialQuery?: string;
  initialType?: string;
  initialMinScore?: string;
}

export function SearchFilterBar({
  initialQuery = '',
  initialType = '',
  initialMinScore = '',
}: SearchFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [minScore, setMinScore] = useState(initialMinScore);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setType(searchParams.get('type') || '');
    setMinScore(searchParams.get('minScore') || '');
  }, [searchParams]);

  const updateSearch = (newQuery: string, newType: string, newScore: string) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set('q', newQuery.trim());
    if (newType) params.set('type', newType);
    if (newScore) params.set('minScore', newScore);

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateSearch(query, type, minScore);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setType(val);
    updateSearch(query, val, minScore);
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMinScore(val);
    updateSearch(query, type, val);
  };

  const handleClear = () => {
    setQuery('');
    setType('');
    setMinScore('');
    router.push('/search');
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-3xl p-6 shadow-xs space-y-4">
      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Search by title, director, cast, keywords..."
            className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-sans text-gray-900 focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => updateSearch(query, type, minScore)}
          disabled={isPending}
          className="px-6 py-3 bg-[#008CFF] hover:bg-[#0077dd] text-white rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isPending ? 'Searching...' : 'Search Takes'}
        </button>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs font-mono">
        <div className="flex items-center space-x-1.5 text-gray-500 mr-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={type}
          onChange={handleTypeChange}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-[#008CFF] cursor-pointer"
        >
          <option value="">All Formats</option>
          <option value="Movie">Movies</option>
          <option value="Series">Series</option>
          <option value="Anime">Anime</option>
          <option value="Documentary">Documentaries</option>
          <option value="Mini Series">Mini Series</option>
          <option value="Special">Specials</option>
        </select>

        <select
          value={minScore}
          onChange={handleScoreChange}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-[#008CFF] cursor-pointer"
        >
          <option value="">All Scores</option>
          <option value="9">9+ (Brilliant & Masterpiece)</option>
          <option value="8">8+ (Amazing or higher)</option>
          <option value="7">7+ (Good or higher)</option>
        </select>

        {(query || type || minScore) && (
          <button
            onClick={handleClear}
            className="text-xs text-rose-600 hover:underline ml-auto font-mono cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
