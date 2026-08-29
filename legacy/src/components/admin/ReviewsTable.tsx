import React, { useState } from 'react';
import { Review, MediaType, ReviewStatus } from '../../types';
import { normalizeScore, getQualityLabel, getRatingColorClasses } from '../../utils/rating';
import {
  Search,
  PlusCircle,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  FileText,
  Filter,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { ReviewLivePreviewModal } from './ReviewLivePreviewModal';

interface ReviewsTableProps {
  reviews: Review[];
  onEditReview: (review: Review) => void;
  onNewReview: () => void;
  onDeleteReview: (id: string) => Promise<void>;
  onDuplicateReview: (id: string) => Promise<void>;
  onToggleStatus: (review: Review, newStatus: ReviewStatus) => Promise<void>;
}

export function ReviewsTable({
  reviews,
  onEditReview,
  onNewReview,
  onDeleteReview,
  onDuplicateReview,
  onToggleStatus,
}: ReviewsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'score' | 'title' | 'views'>('newest');
  const [previewReview, setPreviewReview] = useState<Review | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter & Sort
  const filteredReviews = reviews
    .filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.director?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.genres?.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFormat = selectedFormat === 'all' || r.type === selectedFormat;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'published' && (r.status === 'published' || !r.status)) ||
        r.status === selectedStatus;

      return matchSearch && matchFormat && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime();
      }
      if (sortBy === 'score') {
        return normalizeScore(b.abstractScore) - normalizeScore(a.abstractScore);
      }
      if (sortBy === 'views') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      return a.title.localeCompare(b.title);
    });

  const getScoreBadge = (score: number) => {
    const norm = normalizeScore(score);
    const label = getQualityLabel(norm);
    const colors = getRatingColorClasses(norm);

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${colors.badgeBg} ${colors.badgeText} ${colors.border}`}>
        <span>{norm}/10</span>
        <span className="opacity-50">•</span>
        <span className="text-[10px] uppercase font-semibold">{label}</span>
      </span>
    );
  };

  const getStatusBadge = (status: ReviewStatus = 'published') => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-mono font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Published</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-mono font-bold">
            <Clock className="w-3 h-3" />
            <span>Scheduled</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-[11px] font-mono">
            <Archive className="w-3 h-3" />
            <span>Archived</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-mono font-bold">
            <FileText className="w-3 h-3" />
            <span>Draft</span>
          </span>
        );
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the review for "${title}"?`)) {
      setDeletingId(id);
      try {
        await onDeleteReview(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6 text-gray-900">
      {/* Top Header & Search Bar */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-xl text-gray-900">Editorial Reviews Directory</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage, schedule, edit, and publish your critique articles ({reviews.length} total takes).
          </p>
        </div>

        <button
          onClick={onNewReview}
          className="px-4 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Write New Review</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, director, genre..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
          />
        </div>

        <div>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
          >
            <option value="all">All Formats</option>
            <option value="Movie">Movies</option>
            <option value="Series">Series</option>
            <option value="Anime">Anime</option>
            <option value="Documentary">Documentaries</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-500 font-mono uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Title & Details</th>
                <th className="py-3.5 px-3 font-semibold">Format</th>
                <th className="py-3.5 px-3 font-semibold">Score</th>
                <th className="py-3.5 px-3 font-semibold">Status</th>
                <th className="py-3.5 px-3 font-semibold">Date</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-mono">
                    No reviews match your filters. Click "Write New Review" to create one.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    {/* Title & Poster */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={review.posterUrl}
                          alt={review.title}
                          className="w-10 h-14 object-cover rounded-lg border border-gray-200 shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <h4 className="font-serif font-bold text-sm text-gray-900 truncate group-hover:text-[#008CFF] transition-colors">
                            {review.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 truncate">
                            Dir. {review.director} ({review.releaseYear})
                          </p>
                          <p className="text-[10px] font-mono text-gray-400 truncate mt-0.5">
                            /{review.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Format */}
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-[11px] font-mono border border-gray-200/80">
                        {review.type}
                      </span>
                    </td>

                    {/* Abstract Score */}
                    <td className="py-3 px-3">
                      {getScoreBadge(review.abstractScore)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {getStatusBadge(review.status)}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 font-mono text-gray-500 text-[11px]">
                      {review.publishDate || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Live Preview */}
                        <button
                          onClick={() => setPreviewReview(review)}
                          className="p-2 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 text-gray-600 hover:text-[#008CFF] transition-colors shadow-2xs"
                          title="Live Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditReview(review)}
                          className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors shadow-2xs"
                          title="Edit Review"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Publish/Unpublish toggle */}
                        <button
                          onClick={() =>
                            onToggleStatus(
                              review,
                              review.status === 'published' ? 'draft' : 'published'
                            )
                          }
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition-colors shadow-2xs ${
                            review.status === 'published'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={review.status === 'published' ? 'Unpublish to Draft' : 'Publish to Live Site'}
                        >
                          {review.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicateReview(review.id)}
                          className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors shadow-2xs"
                          title="Duplicate Review"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(review.id, review.title)}
                          disabled={deletingId === review.id}
                          className="p-2 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 text-red-600 transition-colors shadow-2xs disabled:opacity-50"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewReview && (
        <ReviewLivePreviewModal
          review={previewReview}
          isOpen={true}
          onClose={() => setPreviewReview(null)}
        />
      )}
    </div>
  );
}
