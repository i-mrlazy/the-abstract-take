import React, { useState } from 'react';
import { Comment } from '../../types';
import { CheckCircle2, EyeOff, Trash2, MessageSquare, Search } from 'lucide-react';

interface CommentsModeratorProps {
  comments: Comment[];
  onUpdateStatus: (id: string, status: 'approved' | 'pending' | 'hidden') => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
}

export function CommentsModerator({
  comments,
  onUpdateStatus,
  onDeleteComment,
}: CommentsModeratorProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [search, setSearch] = useState('');

  const filtered = comments.filter((c) => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch =
      c.userName.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6 text-gray-900">
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-xl text-gray-900">Reader Comments Moderation</h2>
          <p className="text-xs text-gray-500 mt-1">
            Review, approve, hide, and moderate reader discourse across all reviews.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {(['all', 'pending', 'approved', 'hidden'] as const).map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setFilter(statusKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono capitalize transition-all cursor-pointer ${
                filter === statusKey
                  ? 'bg-[#008CFF] text-white font-bold shadow-xs'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {statusKey} ({statusKey === 'all' ? comments.length : comments.filter((c) => c.status === statusKey).length})
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments by reader name or text..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200/90 rounded-2xl p-12 text-center text-gray-400 font-mono text-xs shadow-sm">
            No comments found in this view.
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-300 transition-all"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-gray-900">{c.userName}</span>
                  <span className="text-[11px] font-mono text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono uppercase font-bold border ${
                      c.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : c.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-gray-700 font-sans leading-relaxed">"{c.content}"</p>
                <p className="text-[10px] font-mono text-gray-400">Review ID: {c.reviewId}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {c.status !== 'approved' && (
                  <button
                    onClick={() => onUpdateStatus(c.id, 'approved')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-mono flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}

                {c.status !== 'hidden' && (
                  <button
                    onClick={() => onUpdateStatus(c.id, 'hidden')}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-mono flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </button>
                )}

                <button
                  onClick={() => onDeleteComment(c.id)}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
                  title="Delete Comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
