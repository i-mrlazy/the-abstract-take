import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RecommendationList, RecommendationListItem } from '../types';
import { Compass, Sparkles, Filter, Tv, ArrowRight, X, UserCheck, Diamond, ArrowLeft, Share2, Check } from 'lucide-react';
import { AbstractScoreBadge } from '../components/AbstractScoreBadge';
import { normalizeScore, getQualityLabel } from '../utils/rating';

interface RecommendsPageProps {
  recommendationLists: RecommendationList[];
  onSelectRecommendationList?: (list: RecommendationList) => void;
  onOpenAiConcierge?: () => void;
}

export const RecommendsPage: React.FC<RecommendsPageProps> = ({
  recommendationLists,
  onOpenAiConcierge,
}) => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeListDetail, setActiveListDetail] = useState<RecommendationList | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync activeListDetail from URL slug
  useEffect(() => {
    if (slug) {
      const found = recommendationLists.find((l) => l.slug === slug || l.id === slug);
      if (found) {
        setActiveListDetail(found);
      }
    } else {
      setActiveListDetail(null);
    }
  }, [slug, recommendationLists]);

  const categories = [
    'All',
    'Hidden Gems',
    'What to Watch Next',
    'Weekend Watchlists',
    'Seasonal',
    'Genre Classics',
    'Top 10',
  ];

  const filteredLists =
    selectedCategory === 'All'
      ? recommendationLists
      : recommendationLists.filter((l) => l.category === selectedCategory);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleOpenList = (list: RecommendationList) => {
    setActiveListDetail(list);
    navigate(`/recommends/${list.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseList = () => {
    setActiveListDetail(null);
    navigate('/recommends');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-[#FAF9F6] text-left">
      {/* Page Header */}
      <div className="bg-white border border-gray-200/90 p-8 sm:p-10 rounded-2xl shadow-sm space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#008CFF] text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-md border border-blue-100">
          <Compass className="w-4 h-4 text-[#008CFF]" />
          <span>CURATED WATCHLISTS & ESSAY COLLECTIONS</span>
        </div>

        <h1 className="font-serif font-black text-3xl sm:text-5xl text-[#111111] tracking-tight">
          The Abstract Recommends
        </h1>

        <p className="font-news text-base sm:text-lg text-gray-700 font-medium max-w-2xl leading-relaxed">
          Things I think you should watch. Zero algorithmic recommendations, zero sponsored lists. Every single collection is handpicked and backed by genuine cinematic passion.
        </p>

        {onOpenAiConcierge && (
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onOpenAiConcierge}
              className="bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-xs flex items-center space-x-2 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>What Should I Watch Next? (Editor's Recommendation)</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      {!activeListDetail && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-gray-400 mr-2 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-[#008CFF]" />
            <span>CATEGORY:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#008CFF] text-white border-[#008CFF] shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Detail View of Selected Recommendation List */}
      {activeListDetail ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCloseList}
              className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-gray-600 hover:text-black uppercase cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Collections</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Collection'}</span>
            </button>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-900">
              <img
                src={activeListDetail.coverUrl}
                alt={activeListDetail.title}
                className="w-full h-full object-cover brightness-[0.4]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 sm:p-10 text-white space-y-2">
                <span className="bg-[#008CFF] text-white text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded w-max">
                  {activeListDetail.category}
                </span>
                <h2 className="font-serif font-black text-2xl sm:text-4xl">{activeListDetail.title}</h2>
                <p className="font-news text-sm sm:text-base text-gray-200 max-w-3xl leading-relaxed">
                  {activeListDetail.description}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-10 space-y-6">
              <h3 className="font-serif font-black text-xl text-[#111111] border-b border-gray-200 pb-3">
                Curated Selections ({activeListDetail.items.length})
              </h3>

              <div className="space-y-6">
                {activeListDetail.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-5 sm:p-6 bg-gray-50/70 border border-gray-200/80 rounded-2xl flex flex-col sm:flex-row gap-6 items-start hover:bg-white hover:border-[#008CFF]/50 transition-all"
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-xl border border-gray-200 shrink-0 shadow-xs"
                    />
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold uppercase bg-gray-900 text-white px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                            <span className="text-xs font-mono text-gray-500">{item.year}</span>
                          </div>
                          <h4 className="font-serif font-black text-lg sm:text-xl text-[#111111] pt-1">
                            {item.title}
                          </h4>
                        </div>
                        <AbstractScoreBadge score={item.abstractScore} size="sm" />
                      </div>

                      <p className="font-news text-sm text-gray-700 leading-relaxed italic">
                        "{item.curatorNote}"
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/60">
                        <span className="text-xs font-mono text-gray-500">
                          <strong>Where to watch:</strong> {item.whereToWatch}
                        </span>
                        {item.reviewId && (
                          <Link
                            to={`/reviews/${item.reviewId}`}
                            className="inline-flex items-center space-x-1 text-xs font-mono font-bold text-[#008CFF] hover:underline"
                          >
                            <span>Read Full Take</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Lists Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLists.map((list) => (
            <div
              key={list.id}
              onClick={() => handleOpenList(list)}
              className="rounded-2xl overflow-hidden cursor-pointer group bg-white flex flex-col justify-between h-full border border-gray-200/90 shadow-sm hover:shadow-md hover:border-[#008CFF]/50 hover:-translate-y-0.5 transition-all"
            >
              <div>
                <div className="relative h-52 w-full border-b border-gray-100 overflow-hidden bg-gray-900">
                  <img
                    src={list.coverUrl}
                    alt={list.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#008CFF] text-white text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md shadow-2xs">
                      {list.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="font-serif font-black text-xl text-[#111111] group-hover:text-[#008CFF] transition-colors leading-snug">
                    {list.title}
                  </h3>
                  <p className="font-news text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {list.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-500">
                <span>{list.items?.length || 0} Curated Picks</span>
                <span className="font-bold text-[#008CFF] group-hover:translate-x-1 transition-transform inline-flex items-center">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
