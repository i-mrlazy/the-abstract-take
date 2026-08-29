import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Review, RecommendationList } from '../types';
import { ReviewCard } from '../components/ReviewCard';
import { RecommendationCard } from '../components/RecommendationCard';
import { AbstractScoreBadge } from '../components/AbstractScoreBadge';
import { AdUnit } from '../components/AdUnit';
import { Sparkles, ArrowRight, Film, Compass, Flame, Clapperboard, Tv, Diamond, ArrowUpRight, CheckCircle2, Bookmark } from 'lucide-react';
import { normalizeScore, getQualityLabel } from '../utils/rating';

interface HomePageProps {
  reviews: Review[];
  recommendationLists: RecommendationList[];
  onSelectReview?: (review: Review) => void;
  onSelectRecommendationList?: (list: RecommendationList) => void;
  onOpenAiConcierge?: () => void;
  setActiveTab?: (tab: string) => void;
  bookmarkedIds?: string[];
  onToggleBookmark?: (id: string, e: React.MouseEvent) => void;
  likedIds?: string[];
  onToggleLike?: (id: string, e: React.MouseEvent) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  reviews,
  recommendationLists,
  onSelectReview,
  onSelectRecommendationList,
  onOpenAiConcierge,
  setActiveTab,
  bookmarkedIds = [],
  onToggleBookmark,
  likedIds = [],
  onToggleLike,
}) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // The latest take & featured takes
  const latestTake = reviews.find((r) => r.isLatestTake) || reviews[0];
  const featuredTakes = reviews.filter((r) => r.id !== latestTake?.id).slice(0, 3);
  const hiddenGems = reviews.filter((r) => r.isHiddenGem || r.tags.includes('Hidden Gems'));
  const personalFavorites = reviews.filter((r) => normalizeScore(r.abstractScore) >= 9);

  const filteredReviews = selectedCategory === 'All'
    ? reviews
    : reviews.filter((r) => r.type.toLowerCase() === selectedCategory.toLowerCase());

  const handleReviewClick = (review: Review) => {
    if (onSelectReview) onSelectReview(review);
    navigate(`/reviews/${review.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecClick = (list: RecommendationList) => {
    if (onSelectRecommendationList) onSelectRecommendationList(list);
    navigate(`/recommends/${list.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-16 pb-20 bg-[#FAF9F6] text-left">
      {/* 1. Large Editorial Statement Hero */}
      <section className="bg-abstract-gradient-hero border-b border-gray-200/80 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-6 text-left relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur border border-gray-200/80 text-[#111111] px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#008CFF] animate-pulse" />
            <span className="text-[#008CFF]">PERSONAL CINEMATIC ESSAYS & REVIEWS</span>
          </div>

          <div className="space-y-3 max-w-4xl">
            <h1 className="font-serif font-black text-4xl sm:text-6xl md:text-7xl text-[#111111] leading-[1.05] tracking-tight">
              MY TAKE ON WHAT’S <br className="hidden sm:inline" />
              <span className="underline decoration-[#00C0FF] decoration-8 underline-offset-8">WORTH WATCHING.</span>
            </h1>
            <p className="font-news text-lg sm:text-xl text-gray-700 leading-relaxed pt-2 max-w-3xl font-medium">
              Honest, unfiltered opinions on cinema, television, anime, and documentaries. No corporate ratings, no algorithmic fluff—just my personal verdict on what’s worth your time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {latestTake && (
              <button
                onClick={() => handleReviewClick(latestTake)}
                className="bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Read My Latest Take</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <Link
              to="/reviews"
              className="bg-white hover:bg-gray-50 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider px-6 py-3.5 border border-gray-200/90 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Explore All Reviews
            </Link>

            <Link
              to="/recommends"
              className="bg-white hover:bg-gray-50 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider px-6 py-3.5 border border-gray-200/90 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#008CFF]" />
              <span>The Abstract Recommends</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Latest Take (Flagship Lead Review) & Recent Stack */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Lead Editorial Review */}
          {latestTake && (
            <div className="lg:col-span-8 bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all space-y-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <span className="bg-[#008CFF] text-white px-3 py-1 rounded-lg text-xs font-mono font-black uppercase tracking-wider shadow-xs">
                    LATEST TAKE
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-500 uppercase">
                    {latestTake.type} • {latestTake.releaseYear} • DIR. {latestTake.director}
                  </span>
                </div>
                <AbstractScoreBadge score={latestTake.abstractScore} size="md" />
              </div>

              <h2
                onClick={() => handleReviewClick(latestTake)}
                className="font-serif font-black text-3xl sm:text-5xl text-[#111111] leading-tight cursor-pointer hover:text-[#008CFF] transition-colors"
              >
                {latestTake.title}
              </h2>

              {/* Main Image Banner */}
              <div
                onClick={() => handleReviewClick(latestTake)}
                className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-gray-100 cursor-pointer group bg-gray-900 shadow-sm"
              >
                <img
                  src={latestTake.bannerUrl}
                  alt={latestTake.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-95"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border border-white/10 shadow-xs">
                  {latestTake.runtime} • {latestTake.genres.join(', ')}
                </div>
                <div className="absolute bottom-3 right-3">
                  <AbstractScoreBadge score={latestTake.abstractScore} size="sm" showLabel={false} />
                </div>
              </div>

              {/* Creator's Thesis Statement */}
              <div className="bg-blue-50/40 border-l-4 border-l-[#008CFF] border-y border-r border-blue-100/60 p-5 rounded-r-xl space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-black tracking-widest text-[#008CFF] block">
                  MY TAKE
                </span>
                <p className="font-news text-base sm:text-lg text-gray-900 leading-relaxed italic">
                  "{latestTake.myTake || latestTake.verdictText}"
                </p>
              </div>

              {/* Quick Pros / Cons Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-emerald-50/50 border border-emerald-200/80 p-3.5 rounded-xl text-xs space-y-1 shadow-2xs">
                  <span className="font-mono font-bold text-emerald-800 uppercase tracking-wider block">
                    What Worked:
                  </span>
                  <p className="text-emerald-950 font-news">{latestTake.pros[0]}</p>
                </div>
                <div className="bg-orange-50/50 border border-orange-200/80 p-3.5 rounded-xl text-xs space-y-1 shadow-2xs">
                  <span className="font-mono font-bold text-orange-800 uppercase tracking-wider block">
                    What Didn't:
                  </span>
                  <p className="text-orange-950 font-news">{latestTake.cons[0] || 'Minor pacing constraints.'}</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <button
                  onClick={() => handleReviewClick(latestTake)}
                  className="bg-[#111111] hover:bg-[#008CFF] text-white font-sans font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <span>Read My Full Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onToggleBookmark && (
                  <button
                    onClick={(e) => onToggleBookmark(latestTake.id, e)}
                    className={`p-2.5 border rounded-xl transition-colors cursor-pointer ${
                      bookmarkedIds.includes(latestTake.id)
                        ? 'bg-[#008CFF] text-white border-[#008CFF]'
                        : 'bg-white hover:bg-gray-100 text-gray-900 border-gray-200'
                    }`}
                    title="Save to Watchlist"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Column: Featured Takes */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-4 text-left">
              <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
                <h3 className="font-mono font-black text-xs uppercase tracking-widest text-[#111111]">
                  FEATURED TAKES
                </h3>
                <span className="text-[10px] font-mono text-[#008CFF] font-bold">RECENT</span>
              </div>

              <div className="space-y-3.5">
                {featuredTakes.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => handleReviewClick(rev)}
                    className="flex gap-3 cursor-pointer group border-b border-gray-100 pb-3.5 last:border-b-0"
                  >
                    <img
                      src={rev.posterUrl}
                      alt={rev.title}
                      className="w-16 h-24 object-cover rounded-lg border border-gray-200/80 flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase font-black text-[#008CFF] tracking-wider">
                          {rev.type}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-gray-400">
                          {normalizeScore(rev.abstractScore)}/10
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-[#111111] group-hover:text-[#008CFF] transition-colors leading-snug line-clamp-1">
                        {rev.title}
                      </h4>
                      <p className="text-[11px] font-news text-gray-500 line-clamp-2 italic">
                        "{rev.myTake || rev.verdictText}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/reviews"
                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider rounded-xl border border-gray-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer block text-center"
              >
                <span>Browse All Takes Archive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Abstract Recommends (Curated Watchlists Preview) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold uppercase text-[#008CFF] tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>THE ABSTRACT RECOMMENDS</span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-4xl text-[#111111]">
              Curated Thematic Watchlists
            </h2>
            <p className="text-gray-600 text-xs font-news">
              Thematic lists, weekend watches, and deep-dive cinema collections.
            </p>
          </div>

          <Link
            to="/recommends"
            className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-[#008CFF] hover:text-[#0077dd] uppercase tracking-wider transition-colors cursor-pointer"
          >
            <span>View All Collections</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendationLists.slice(0, 3).map((list) => (
            <RecommendationCard
              key={list.id}
              list={list}
              onSelect={() => handleRecClick(list)}
            />
          ))}
        </div>
      </section>

      {/* 4. Complete Takes Feed with Filter Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold uppercase text-[#008CFF] tracking-wider">
              <Clapperboard className="w-3.5 h-3.5" />
              <span>RECENT EDITORIAL ESSAYS</span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-4xl text-[#111111]">
              Latest Takes Feed
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Movie', 'Series', 'Anime', 'Documentary'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {cat === 'All' ? 'All Formats' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.slice(0, 6).map((rev) => (
            <ReviewCard
              key={rev.id}
              review={rev}
              onSelect={(r) => handleReviewClick(r)}
              isBookmarked={bookmarkedIds.includes(rev.id)}
              onToggleBookmark={(e) => onToggleBookmark?.(rev.id, e)}
              isLiked={likedIds.includes(rev.id)}
              onToggleLike={(e) => onToggleLike?.(rev.id, e)}
            />
          ))}
        </div>

        <div className="text-center pt-6">
          <Link
            to="/reviews"
            className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 text-[#111111] font-sans font-bold text-xs uppercase tracking-wider px-8 py-3.5 border border-gray-300 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <span>Explore Complete Archive ({reviews.length} Takes)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 5. Signature Masterpieces Box (Score 9 & 10) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold uppercase text-[#008CFF] tracking-wider">
                <Diamond className="w-3.5 h-3.5" />
                <span>SIGNATURE TIER</span>
              </div>
              <h2 className="font-serif font-black text-2xl sm:text-4xl text-[#111111]">
                Personal Favorites & Masterpieces
              </h2>
              <p className="text-gray-600 text-xs font-news">
                Titles with an Abstract Score of 9 or 10 that have shaped my cinematic worldview.
              </p>
            </div>

            <Link
              to="/reviews?minScore=9"
              className="bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-xs"
            >
              View Masterpieces
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personalFavorites.slice(0, 3).map((rev) => (
              <div
                key={rev.id}
                onClick={() => handleReviewClick(rev)}
                className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 cursor-pointer group hover:border-[#008CFF] hover:bg-white hover:shadow-lg transition-all space-y-3"
              >
                <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-gray-900 border border-gray-100 shadow-2xs">
                  <img
                    src={rev.bannerUrl}
                    alt={rev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute top-2 left-2 bg-[#008CFF] text-white text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded shadow-xs">
                    SCORE {normalizeScore(rev.abstractScore)}/10
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif font-black text-xl text-[#111111] group-hover:text-[#008CFF] transition-colors line-clamp-1">
                    {rev.title}
                  </h3>
                  <p className="text-xs font-mono text-gray-500">
                    Dir. {rev.director} ({rev.releaseYear})
                  </p>
                  <p className="text-xs font-news text-gray-700 line-clamp-2 pt-1 italic">
                    "{rev.myTake || rev.verdictText}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Monetization & Sponsor Units */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdUnit type="mubi-affiliate" />
        <AdUnit type="editorial-promo" />
        <AdUnit type="buy-coffee" />
      </section>
    </div>
  );
};
