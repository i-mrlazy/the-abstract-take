import React from 'react';
import { Review, RecommendationList, Comment, AnalyticsSummary } from '../../types';
import {
  FileText,
  Clock,
  Sparkles,
  MessageSquare,
  Mail,
  TrendingUp,
  PlusCircle,
  Eye,
  Edit,
  CheckCircle2,
  Film,
  Tv,
  ExternalLink,
} from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface DashboardOverviewProps {
  reviews: Review[];
  recommendationLists: RecommendationList[];
  comments: Comment[];
  analytics: any;
  onNavigate: (tab: AdminTab) => void;
  onEditReview: (review: Review) => void;
  onApproveComment: (id: string) => Promise<void>;
  onViewLiveSite: () => void;
}

export function DashboardOverview({
  reviews,
  recommendationLists,
  comments,
  analytics,
  onNavigate,
  onEditReview,
  onApproveComment,
  onViewLiveSite,
}: DashboardOverviewProps) {
  const publishedCount = reviews.filter((r) => r.status === 'published' || !r.status).length;
  const draftsCount = reviews.filter((r) => r.status === 'draft').length;
  const scheduledCount = reviews.filter((r) => r.status === 'scheduled').length;
  const pendingComments = comments.filter((c) => c.status === 'pending');

  const moviesCount = reviews.filter((r) => r.type === 'Movie').length;
  const seriesCount = reviews.filter((r) => r.type === 'Series' || r.type === 'Mini Series').length;
  const animeCount = reviews.filter((r) => r.type === 'Anime').length;

  const recentReviews = reviews.slice(0, 5);

  return (
    <div className="space-y-6 text-gray-900">
      {/* Top Welcome Banner */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 bg-blue-50 text-[#008CFF] border border-blue-100 text-[11px] font-mono font-bold rounded-lg mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#008CFF] animate-pulse"></span>
            <span>EDITORIAL DESK LIVE</span>
          </div>
          <h1 className="font-serif font-black text-2xl lg:text-3xl text-gray-900">
            Welcome to The Abstract Take CMS
          </h1>
          <p className="text-xs text-gray-600 mt-1 max-w-2xl">
            You have full editorial autonomy to publish critiques, import cinematic metadata, curate watchlists, and manage reader engagement in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('new-review')}
            className="px-4 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Write New Review</span>
          </button>

          <button
            onClick={onViewLiveSite}
            className="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 text-xs font-mono flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-[#008CFF]" />
            <span>Live Site</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Published Reviews */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono uppercase font-semibold">Published Takes</span>
            <div className="p-2 bg-blue-50 text-[#008CFF] rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-black text-3xl text-gray-900">{publishedCount}</span>
            <span className="text-[11px] font-mono text-gray-500 block mt-0.5">
              Live on publication
            </span>
          </div>
        </div>

        {/* Drafts & Scheduled */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono uppercase font-semibold">In Progress</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="font-serif font-black text-3xl text-gray-900">{draftsCount}</span>
              <span className="text-xs font-mono text-amber-700 font-bold">Drafts</span>
              {scheduledCount > 0 && (
                <span className="text-xs font-mono text-purple-700">({scheduledCount} scheduled)</span>
              )}
            </div>
            <span className="text-[11px] font-mono text-gray-500 block mt-0.5">
              Private in editor
            </span>
          </div>
        </div>

        {/* Watchlists */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono uppercase font-semibold">Curated Watchlists</span>
            <div className="p-2 bg-blue-50 text-[#008CFF] rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-black text-3xl text-gray-900">
              {recommendationLists.length}
            </span>
            <span className="text-[11px] font-mono text-gray-500 block mt-0.5">
              "The Abstract Recommends"
            </span>
          </div>
        </div>

        {/* Newsletter Subscribers */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono uppercase font-semibold">Subscribers</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-black text-3xl text-gray-900">
              {analytics?.newsletterSubscribers || 4890}
            </span>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center space-x-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+24.6% monthly growth</span>
            </span>
          </div>
        </div>
      </div>

      {/* Format Breakdown & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Format Distribution Card */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-black text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
              <Film className="w-4 h-4" />
            </div>
            <span>Editorial Format Distribution</span>
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5 text-gray-700">
                <span className="font-medium">Feature Films</span>
                <span className="text-[#008CFF] font-bold">{moviesCount}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#008CFF] h-full rounded-full transition-all"
                  style={{ width: `${(moviesCount / (reviews.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5 text-gray-700">
                <span className="font-medium">Television & Series</span>
                <span className="text-purple-600 font-bold">{seriesCount}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{ width: `${(seriesCount / (reviews.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5 text-gray-700">
                <span className="font-medium">Anime Series & Films</span>
                <span className="text-emerald-600 font-bold">{animeCount}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${(animeCount / (reviews.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Comments Callout */}
        <div className="lg:col-span-2 bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-serif font-black text-base text-gray-900 flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span>Comments Needing Moderation ({pendingComments.length})</span>
            </h3>
            <button
              onClick={() => onNavigate('comments')}
              className="text-xs font-mono text-[#008CFF] font-semibold hover:underline"
            >
              View All Queue →
            </button>
          </div>

          {pendingComments.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-gray-500 bg-gray-50/50 rounded-xl border border-gray-100">
              ✓ All reader comments are moderated and up to date.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingComments.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-gray-50/70 border border-gray-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{c.userName}</p>
                    <p className="text-xs text-gray-600 truncate mt-0.5">"{c.content}"</p>
                  </div>
                  <button
                    onClick={() => onApproveComment(c.id)}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-mono font-bold flex items-center space-x-1 shrink-0 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Editorial Takes */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-serif font-black text-base text-gray-900 flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <span>Recent Editorial Reviews</span>
          </h3>
          <button
            onClick={() => onNavigate('reviews')}
            className="text-xs font-mono text-[#008CFF] font-semibold hover:underline"
          >
            View All Reviews ({reviews.length}) →
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {recentReviews.map((review) => (
            <div
              key={review.id}
              className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/70 px-3 rounded-xl transition-colors"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <img
                  src={review.posterUrl}
                  alt={review.title}
                  className="w-10 h-14 object-cover rounded-lg border border-gray-200 shrink-0 shadow-2xs"
                />
                <div className="min-w-0">
                  <h4 className="font-serif font-bold text-sm text-gray-900 truncate hover:text-[#008CFF] transition-colors">
                    {review.title} ({review.releaseYear})
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-1 italic">
                    "{review.myTake}"
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className="px-2.5 py-1 bg-blue-50 text-[#008CFF] border border-blue-100 font-mono font-bold text-xs rounded-lg">
                  {review.abstractScore} / 100
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold border ${
                  review.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {review.status || 'published'}
                </span>
                <button
                  onClick={() => onEditReview(review)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 transition-colors shadow-2xs"
                  title="Edit Review"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
