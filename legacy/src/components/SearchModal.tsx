import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Review, RecommendationList } from '../types';
import { Search, X, Filter, Tv, Star, Film } from 'lucide-react';
import { AbstractScoreBadge } from './AbstractScoreBadge';
import { normalizeScore, getQualityLabel } from '../utils/rating';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  recommendationLists: RecommendationList[];
  onSelectReview?: (review: Review) => void;
  onSelectRecommendationList?: (list: RecommendationList) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  reviews,
  recommendationLists,
  onSelectReview,
  onSelectRecommendationList,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [minScore, setMinScore] = useState<number>(0);

  const mediaTypes = ['All', 'Movie', 'Series', 'Anime', 'Documentary'];

  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const matchesQuery =
        !query ||
        rev.title.toLowerCase().includes(query.toLowerCase()) ||
        rev.director.toLowerCase().includes(query.toLowerCase()) ||
        rev.cast.some((c) => c.toLowerCase().includes(query.toLowerCase())) ||
        rev.genres.some((g) => g.toLowerCase().includes(query.toLowerCase()));

      const matchesType = selectedType === 'All' || rev.type === selectedType;
      const s = normalizeScore(rev.abstractScore);
      const matchesScore = s >= minScore;

      return matchesQuery && matchesType && matchesScore;
    });
  }, [reviews, query, selectedType, minScore]);

  const filteredLists = useMemo(() => {
    if (!query) return recommendationLists;
    return recommendationLists.filter((list) =>
      list.title.toLowerCase().includes(query.toLowerCase()) ||
      list.description.toLowerCase().includes(query.toLowerCase()) ||
      list.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [recommendationLists, query]);

  if (!isOpen) return null;

  const handleReviewClick = (rev: Review) => {
    if (onSelectReview) onSelectReview(rev);
    navigate(`/reviews/${rev.slug}`);
    onClose();
  };

  const handleListClick = (list: RecommendationList) => {
    if (onSelectRecommendationList) onSelectRecommendationList(list);
    navigate(`/recommends/${list.slug}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200/90 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col text-left">
        {/* Modal Header */}
        <div className="p-5 bg-white text-gray-900 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center space-x-2 font-sans font-bold text-base text-[#111111]">
            <div className="p-2 bg-blue-50 text-[#008CFF] rounded-xl border border-blue-100">
              <Search className="w-4 h-4" />
            </div>
            <span>Search & Discover — The Abstract Take</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="p-6 bg-gray-50 border-b border-gray-100 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-[#008CFF] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search by title, director, cast, keyword, genre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-news placeholder-gray-400 focus:outline-none focus:border-[#008CFF] focus:ring-1 focus:ring-[#008CFF] text-black shadow-2xs"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-gray-400 uppercase font-bold text-[10px]">Media Type:</span>
              <div className="flex space-x-1">
                {mediaTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] uppercase transition-all cursor-pointer ${
                      selectedType === type
                        ? 'bg-[#111111] text-white shadow-2xs font-bold'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-mono text-gray-400 uppercase font-bold text-[10px]">Min Score:</span>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 font-mono text-xs text-gray-800 focus:outline-none focus:border-[#008CFF]"
              >
                <option value={0}>Any Score</option>
                <option value={8}>8+ (Amazing)</option>
                <option value={9}>9+ (Brilliant)</option>
                <option value={10}>10 (Masterpiece)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* Reviews Section */}
          <div>
            <div className="font-sans font-bold text-xs uppercase tracking-wider text-[#111111] mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
              <span>Reviews ({filteredReviews.length})</span>
              {query && <span className="font-mono text-[10px] text-gray-400 font-normal">Matched in titles, directors, cast</span>}
            </div>

            {filteredReviews.length === 0 ? (
              <div className="p-8 bg-gray-50 border border-gray-100 rounded-2xl text-center space-y-1 text-xs text-gray-500">
                <Film className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <p className="font-medium">No reviews match your query.</p>
                <p className="font-mono text-[10px] text-gray-400">Try searching for a different keyword or genre.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredReviews.map((rev) => {
                  const score = normalizeScore(rev.abstractScore);
                  return (
                    <div
                      key={rev.id}
                      onClick={() => handleReviewClick(rev)}
                      className="p-3.5 bg-white border border-gray-200/90 rounded-2xl hover:border-[#008CFF] hover:shadow-sm cursor-pointer flex gap-3.5 transition-all"
                    >
                      <img
                        src={rev.posterUrl}
                        alt={rev.title}
                        className="w-16 h-24 object-cover border border-gray-200 rounded-xl flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="font-serif font-black text-base text-[#111111] line-clamp-1">
                              {rev.title}
                            </h4>
                            <span className="text-xs font-mono font-bold text-[#008CFF] bg-blue-50 px-1.5 py-0.5 rounded">
                              {score}/10
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-gray-400">
                            {rev.releaseYear} • Dir. {rev.director}
                          </p>
                        </div>
                        <p className="text-[11px] font-news text-gray-600 line-clamp-2 italic">
                          "{rev.myTake || rev.verdictText}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Curated Lists Section */}
          {filteredLists.length > 0 && (
            <div>
              <div className="font-sans font-bold text-xs uppercase tracking-wider text-[#111111] mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                <span>The Abstract Recommends Watchlists ({filteredLists.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredLists.map((list) => (
                  <div
                    key={list.id}
                    onClick={() => handleListClick(list)}
                    className="p-3.5 bg-white border border-gray-200/90 rounded-2xl hover:border-[#008CFF] hover:shadow-sm cursor-pointer flex gap-3.5 transition-all"
                  >
                    <img
                      src={list.coverUrl}
                      alt={list.title}
                      className="w-20 h-20 object-cover border border-gray-200 rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase bg-blue-50 text-[#008CFF] border border-blue-100 px-2 py-0.5 rounded-md">
                          {list.category}
                        </span>
                        <h4 className="font-serif font-bold text-sm text-[#111111] line-clamp-1 mt-1">
                          {list.title}
                        </h4>
                      </div>
                      <p className="text-[11px] font-news text-gray-500 line-clamp-1 italic">
                        {list.items.length} titles included
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
