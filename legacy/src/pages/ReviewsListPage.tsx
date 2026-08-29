import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Review, MediaType } from '../types';
import { ReviewCard } from '../components/ReviewCard';
import { Film, Filter, SlidersHorizontal, Search, Sparkles, Tv, Clapperboard } from 'lucide-react';
import { normalizeScore, getQualityLabel } from '../utils/rating';

interface ReviewsListPageProps {
  reviews: Review[];
  onSelectReview?: (review: Review) => void;
  bookmarkedIds?: string[];
  onToggleBookmark?: (id: string, e: React.MouseEvent) => void;
  likedIds?: string[];
  onToggleLike?: (id: string, e: React.MouseEvent) => void;
  defaultTypeFilter?: string;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const ReviewsListPage: React.FC<ReviewsListPageProps> = ({
  reviews,
  onSelectReview,
  bookmarkedIds = [],
  onToggleBookmark,
  likedIds = [],
  onToggleLike,
  defaultTypeFilter = 'All',
  pageTitle,
  pageSubtitle,
}) => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read search query from URL (?q=...)
  const urlQuery = searchParams.get('q') || '';
  const urlType = searchParams.get('type') || defaultTypeFilter;
  const urlMinScore = searchParams.get('minScore');

  const [selectedType, setSelectedType] = useState<string>(urlType);
  const [selectedTier, setSelectedTier] = useState<string>(urlMinScore || 'All');
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);
  const [sortBy, setSortBy] = useState<'newest' | 'score' | 'popular'>('newest');

  // Sync state if URL search query or type changes
  useEffect(() => {
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    if (defaultTypeFilter !== 'All') {
      setSelectedType(defaultTypeFilter);
    }
  }, [defaultTypeFilter]);

  const mediaTypes = ['All', 'Movie', 'Series', 'Anime', 'Documentary', 'Mini Series', 'Special'];
  const scoreTiers = [
    { label: 'All Scores', value: 'All' },
    { label: '10 · Masterpiece', value: '10' },
    { label: '9 · Brilliant', value: '9' },
    { label: '8 · Amazing', value: '8' },
    { label: '7 · Good', value: '7' },
    { label: '6 · Decent', value: '6' },
    { label: '5 · Average', value: '5' },
    { label: '1-4 · Underwhelming & Below', value: 'underwhelming' },
  ];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set('q', value.trim());
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams, { replace: true });
  };

  let filtered = reviews.filter((r) => {
    const s = normalizeScore(r.abstractScore);
    
    // Type matching
    let matchesType = true;
    if (selectedType !== 'All') {
      if (selectedType.toLowerCase() === 'movie') matchesType = r.type === 'Movie';
      else if (selectedType.toLowerCase() === 'series') matchesType = r.type === 'Series';
      else if (selectedType.toLowerCase() === 'anime') matchesType = r.type === 'Anime';
      else if (selectedType.toLowerCase() === 'documentary' || selectedType.toLowerCase() === 'documentaries') matchesType = r.type === 'Documentary';
      else if (selectedType.toLowerCase() === 'mini-series' || selectedType.toLowerCase() === 'mini series') matchesType = r.type === 'Mini Series';
      else if (selectedType.toLowerCase() === 'special' || selectedType.toLowerCase() === 'specials') matchesType = r.type === 'Special';
      else matchesType = r.type.toLowerCase() === selectedType.toLowerCase();
    }

    // Category or Tag slug matching from route `/category/:slug` or `/tags/:slug`
    if (slug) {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchesCategory = r.category?.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSlug) ||
        r.genres?.some((g) => g.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSlug));
      const matchesTag = r.tags?.some((t) => t.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSlug));
      if (!matchesCategory && !matchesTag) {
        return false;
      }
    }
    
    // Score tier matching
    let matchesTier = true;
    if (selectedTier === '10') matchesTier = s === 10;
    else if (selectedTier === '9') matchesTier = s === 9;
    else if (selectedTier === '8') matchesTier = s === 8;
    else if (selectedTier === '7') matchesTier = s === 7;
    else if (selectedTier === '6') matchesTier = s === 6;
    else if (selectedTier === '5') matchesTier = s === 5;
    else if (selectedTier === 'underwhelming') matchesTier = s <= 4;

    // Search query matching
    const matchesSearch = searchQuery.trim() === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.myTake.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.cast && r.cast.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesType && matchesTier && matchesSearch;
  });

  if (sortBy === 'score') {
    filtered = [...filtered].sort((a, b) => normalizeScore(b.abstractScore) - normalizeScore(a.abstractScore));
  } else if (sortBy === 'popular') {
    filtered = [...filtered].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  }

  // Derive dynamic header
  const title = pageTitle || (slug ? `Archive: ${slug.replace(/-/g, ' ').toUpperCase()}` : defaultTypeFilter !== 'All' ? `${defaultTypeFilter} Reviews` : 'My Reviews & Takes');
  const subtitle = pageSubtitle || (slug ? `Editorial critiques matching category "${slug.replace(/-/g, ' ')}".` : 'My complete archive of personal movie, series, anime, and documentary critiques scored on the 1–10 editorial scale.');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#FAF9F6] text-left">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200/90 p-6 sm:p-10 rounded-2xl shadow-sm space-y-3">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#008CFF] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">
          <Film className="w-3.5 h-3.5 text-[#008CFF]" />
          <span>EDITORIAL ARCHIVE & REVIEWS</span>
        </div>
        <h1 className="font-serif font-black text-3xl sm:text-5xl text-[#111111] tracking-tight capitalize">
          {title}
        </h1>
        <p className="font-news text-base text-gray-700 font-medium max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-white border border-gray-200/90 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        {/* Search & Sort top row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by title, director, genre, actor..."
              className="w-full bg-gray-50/70 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono placeholder-gray-400 focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all text-black"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono bg-gray-50/70 border border-gray-200 px-3.5 py-2 rounded-xl w-full md:w-auto justify-between md:justify-start">
            <span className="font-bold text-gray-500">SORT BY:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-[#111111] focus:outline-none cursor-pointer text-xs"
            >
              <option value="newest">Latest Published</option>
              <option value="score">Highest Abstract Score</option>
              <option value="popular">Most Read</option>
            </select>
          </div>
        </div>

        {/* Media Type & Score Filter Pills */}
        <div className="pt-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-t border-gray-100">
          {/* Media Type Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase mr-1">FORMAT:</span>
            {mediaTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedType.toLowerCase() === type.toLowerCase()
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Rating Tier Dropdown */}
          <div className="flex items-center space-x-2 w-full lg:w-auto justify-between">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase shrink-0">SCORE TIER:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-gray-100/80 border border-gray-200 text-gray-800 focus:outline-none focus:border-[#008CFF] cursor-pointer"
            >
              {scoreTiers.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider">
            Showing {filtered.length} {filtered.length === 1 ? 'Take' : 'Takes'}
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onSelect={(r) => {
                  if (onSelectReview) onSelectReview(r);
                  navigate(`/reviews/${r.slug}`);
                }}
                isBookmarked={bookmarkedIds.includes(review.id)}
                onToggleBookmark={(e) => onToggleBookmark?.(review.id, e)}
                isLiked={likedIds.includes(review.id)}
                onToggleLike={(e) => onToggleLike?.(review.id, e)}
              />
            ))}
          </div>
        ) : (
          <div className="p-16 bg-white border border-gray-200/90 rounded-2xl text-center space-y-3">
            <Sparkles className="w-8 h-8 text-gray-400 mx-auto" />
            <h3 className="font-serif font-bold text-lg text-gray-800">No critiques found matching your criteria</h3>
            <p className="font-news text-xs text-gray-500 max-w-sm mx-auto">
              Try adjusting your search query, media format, or score filter.
            </p>
            <button
              onClick={() => {
                setSelectedType('All');
                setSelectedTier('All');
                handleSearchChange('');
              }}
              className="mt-2 text-xs font-mono font-bold text-[#008CFF] hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
