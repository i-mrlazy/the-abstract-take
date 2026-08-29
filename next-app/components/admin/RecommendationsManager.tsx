'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RecommendationList, RecommendationListItem } from '@/types';
import { RATING_SCALE, normalizeScore } from '@/lib/utils/rating';
import { Plus, Trash2, Edit, ArrowLeft, MoveUp, MoveDown, Check, ListOrdered } from 'lucide-react';

interface RecommendationsManagerProps {
  initialLists: RecommendationList[];
}

export function RecommendationsManager({ initialLists }: RecommendationsManagerProps) {
  const router = useRouter();
  const [lists, setLists] = useState<RecommendationList[]>(initialLists);
  const [editingList, setEditingList] = useState<RecommendationList | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('Weekend Watchlists');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState(
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop'
  );
  const [items, setItems] = useState<RecommendationListItem[]>([]);

  const handleStartEdit = (list: RecommendationList) => {
    setEditingList(list);
    setIsCreatingNew(false);
    setTitle(list.title);
    setSubtitle(list.subtitle);
    setCategory(list.category);
    setDescription(list.description);
    setCoverUrl(list.coverUrl);
    setItems(list.items || []);
  };

  const handleStartNew = () => {
    setEditingList(null);
    setIsCreatingNew(true);
    setTitle('');
    setSubtitle('');
    setCategory('Weekend Watchlists');
    setDescription('');
    setCoverUrl(
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop'
    );
    setItems([
      {
        id: `item-${Date.now()}`,
        title: '',
        type: 'Movie',
        year: new Date().getFullYear(),
        director: '',
        posterUrl:
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
        abstractScore: 9,
        curatorNote: '',
        whereToWatch: 'Max / Criterion',
      },
    ]);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${items.length}`,
        title: '',
        type: 'Movie',
        year: new Date().getFullYear(),
        director: '',
        posterUrl:
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
        abstractScore: 9,
        curatorNote: '',
        whereToWatch: 'Max / Apple TV',
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof RecommendationListItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === items.length - 1))
      return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setItems(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for the recommendation list.');
      return;
    }
    const cleanSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const listToSave: RecommendationList = {
      id: editingList?.id || `rec-${Date.now()}`,
      slug: editingList?.slug || cleanSlug,
      title: title.trim(),
      subtitle: subtitle.trim(),
      status: editingList?.status || 'published',
      category: category as any,
      description: description.trim(),
      coverUrl: coverUrl.trim(),
      curatorName: 'The Abstract Take',
      updatedDate: new Date().toISOString().split('T')[0],
      readsCount: editingList?.readsCount || 0,
      items: items
        .filter((i) => i.title.trim())
        .map((i) => ({ ...i, abstractScore: normalizeScore(i.abstractScore) })),
    };

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listToSave),
      });
      if (res.ok) {
        setLists((prev) => {
          const idx = prev.findIndex((l) => l.id === listToSave.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = listToSave;
            return copy;
          }
          return [listToSave, ...prev];
        });
        setEditingList(null);
        setIsCreatingNew(false);
        router.refresh();
      }
    } catch (err) {
      console.error('Save recommendation error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this watchlist?')) {
      try {
        const res = await fetch(`/api/recommendations/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setLists((prev) => prev.filter((l) => l.id !== id));
          router.refresh();
        }
      } catch (err) {
        console.error('Delete recommendation error:', err);
      }
    }
  };

  if (editingList || isCreatingNew) {
    return (
      <div className="space-y-6 text-gray-900 max-w-4xl mx-auto pb-24">
        <div className="flex items-center justify-between bg-white border border-gray-200/90 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setEditingList(null);
                setIsCreatingNew(false);
              }}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-700 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-serif font-black text-lg text-gray-900">
              {isCreatingNew ? 'Create New Watchlist' : `Edit Watchlist: ${title}`}
            </h3>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save Watchlist</span>
          </button>
        </div>

        {/* List Info */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                List Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 5 Modern Sci-Fi Masterpieces That Defy Gravity"
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="Weekend Watchlists">Weekend Watchlists</option>
                <option value="Hidden Gems">Hidden Gems</option>
                <option value="Personal Favorites">Personal Favorites</option>
                <option value="Best By Genre">Best By Genre</option>
                <option value="Best By Director">Best By Director</option>
                <option value="Underrated">Underrated</option>
                <option value="Top 10">Top 10</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. High-concept cinema that prioritizes philosophy over empty explosions"
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Description / Editorial Intro
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Curator's introduction to why these specific titles are curated together..."
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Cover Image URL
              </label>
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Curated Items Builder */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 className="font-serif font-black text-base text-gray-900 flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
                <ListOrdered className="w-4 h-4" />
              </div>
              <span>Curated Items ({items.length})</span>
            </h4>
            <button
              onClick={handleAddItem}
              className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-gray-50/70 border border-gray-200 rounded-2xl p-4 space-y-3 relative group hover:border-[#008CFF] transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#008CFF] font-bold">
                    #{idx + 1} Recommendation
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleMoveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 disabled:opacity-30 transition-colors"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveItem(idx, 'down')}
                      disabled={idx === items.length - 1}
                      className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 disabled:opacity-30 transition-colors"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                      placeholder="e.g. Arrival (2016)"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#008CFF] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">
                      Director
                    </label>
                    <input
                      type="text"
                      value={item.director}
                      onChange={(e) => handleUpdateItem(idx, 'director', e.target.value)}
                      placeholder="Denis Villeneuve"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#008CFF] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">
                      Score (1-10 Scale)
                    </label>
                    <select
                      value={normalizeScore(item.abstractScore)}
                      onChange={(e) =>
                        handleUpdateItem(idx, 'abstractScore', Number(e.target.value))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-[#008CFF] shadow-2xs cursor-pointer"
                    >
                      {RATING_SCALE.map((tier) => (
                        <option key={tier.score} value={tier.score}>
                          {tier.score}/10 — {tier.descriptor}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">
                      Poster URL
                    </label>
                    <input
                      type="text"
                      value={item.posterUrl}
                      onChange={(e) => handleUpdateItem(idx, 'posterUrl', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#008CFF] shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">
                      Where To Watch
                    </label>
                    <input
                      type="text"
                      value={item.whereToWatch}
                      onChange={(e) => handleUpdateItem(idx, 'whereToWatch', e.target.value)}
                      placeholder="e.g. Paramount+ / VOD"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#008CFF] shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">
                      Curator Commentary / Why Watch
                    </label>
                    <textarea
                      rows={2}
                      value={item.curatorNote}
                      onChange={(e) => handleUpdateItem(idx, 'curatorNote', e.target.value)}
                      placeholder="Why this movie is essential viewing..."
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#008CFF] shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-900">
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-xl text-gray-900">
            "The Abstract Recommends" Watchlists
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Curate multi-film watchlists, weekend playlists, and themed recommendation dossiers.
          </p>
        </div>

        <button
          onClick={handleStartNew}
          className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Watchlist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lists.map((list) => (
          <div
            key={list.id}
            className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#008CFF]/50 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#008CFF] border border-blue-200 text-[10px] font-mono font-bold rounded-lg">
                  {list.category}
                </span>
                <span className="text-[11px] font-mono text-gray-500">
                  {list.items?.length || 0} Titles
                </span>
              </div>

              <h3 className="font-serif font-bold text-base text-gray-900 group-hover:text-[#008CFF] transition-colors">
                {list.title}
              </h3>
              <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                {list.subtitle}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
              <span className="text-[11px] font-mono text-gray-400">
                Updated {list.updatedDate}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStartEdit(list)}
                  className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(list.id)}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
                  title="Delete Watchlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
