'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WhatToWatchNextItem, MediaType } from '@/types';
import { RATING_SCALE, normalizeScore, getQualityLabel } from '@/lib/utils/rating';
import { Plus, Trash2, Edit } from 'lucide-react';

interface WhatToWatchNextManagerProps {
  initialItems: WhatToWatchNextItem[];
}

export function WhatToWatchNextManager({ initialItems }: WhatToWatchNextManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<WhatToWatchNextItem[]>(initialItems);
  const [editingItem, setEditingItem] = useState<WhatToWatchNextItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('Movie');
  const [releaseYear, setReleaseYear] = useState<number>(new Date().getFullYear());
  const [director, setDirector] = useState('');
  const [abstractScore, setAbstractScore] = useState<number>(9);
  const [moodTag, setMoodTag] = useState('');
  const [personalCommentary, setPersonalCommentary] = useState('');
  const [whereToWatch, setWhereToWatch] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [readyForNewsletter, setReadyForNewsletter] = useState(true);

  const handleStartNew = () => {
    setEditingItem(null);
    setIsCreating(true);
    setTitle('');
    setType('Movie');
    setReleaseYear(new Date().getFullYear());
    setDirector('');
    setAbstractScore(9);
    setMoodTag('Pulse-Pounding & Kinetic');
    setPersonalCommentary('');
    setWhereToWatch('Max / Criterion Channel');
    setPosterUrl(
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop'
    );
    setReadyForNewsletter(true);
  };

  const handleStartEdit = (item: WhatToWatchNextItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setTitle(item.title);
    setType(item.type);
    setReleaseYear(item.releaseYear);
    setDirector(item.director);
    setAbstractScore(normalizeScore(item.abstractScore));
    setMoodTag(item.moodTag);
    setPersonalCommentary(item.personalCommentary);
    setWhereToWatch(item.whereToWatch);
    setPosterUrl(item.posterUrl);
    setReadyForNewsletter(item.readyForNewsletter ?? true);
  };

  const handleSave = async () => {
    if (!title.trim() || !personalCommentary.trim()) {
      alert('Please enter title and commentary.');
      return;
    }
    const itemToSave: WhatToWatchNextItem = {
      id: editingItem?.id || `next-${Date.now()}`,
      title: title.trim(),
      type,
      releaseYear: Number(releaseYear),
      director: director.trim(),
      abstractScore: normalizeScore(abstractScore),
      moodTag: moodTag.trim(),
      personalCommentary: personalCommentary.trim(),
      whereToWatch: whereToWatch.trim(),
      posterUrl:
        posterUrl.trim() ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
      publishDate: editingItem?.publishDate || new Date().toISOString().split('T')[0],
      status: 'published',
      readyForNewsletter,
    };

    try {
      const res = await fetch('/api/what-to-watch-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToSave),
      });
      if (res.ok) {
        setItems((prev) => {
          const idx = prev.findIndex((i) => i.id === itemToSave.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = itemToSave;
            return copy;
          }
          return [itemToSave, ...prev];
        });
        setEditingItem(null);
        setIsCreating(false);
        router.refresh();
      }
    } catch (err) {
      console.error('Save what-to-watch error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recommendation pick?')) {
      try {
        const res = await fetch(`/api/what-to-watch-next/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setItems((prev) => prev.filter((i) => i.id !== id));
          router.refresh();
        }
      } catch (err) {
        console.error('Delete what-to-watch error:', err);
      }
    }
  };

  return (
    <div className="space-y-6 text-gray-900">
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-xl text-gray-900">
            "What Should I Watch Next?" Editorial Dispatch
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Quick-hit high-impact recommendations synced with Editor's Recommendation and newsletter dispatches.
          </p>
        </div>

        <button
          onClick={handleStartNew}
          className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Recommendation</span>
        </button>
      </div>

      {(editingItem || isCreating) && (
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-serif font-black text-base text-gray-900">
              {isCreating ? 'Add Watch Next Pick' : `Edit Pick: ${title}`}
            </h3>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsCreating(false);
              }}
              className="text-xs font-mono text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Challengers (2024)"
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Mood Tag
              </label>
              <input
                type="text"
                value={moodTag}
                onChange={(e) => setMoodTag(e.target.value)}
                placeholder="e.g. Electric, Kinetic & Tense"
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Director
              </label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="Luca Guadagnino"
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Abstract Score (1-10 Scale)
              </label>
              <select
                value={normalizeScore(abstractScore)}
                onChange={(e) => setAbstractScore(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs font-mono focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all cursor-pointer"
              >
                {RATING_SCALE.map((tier) => (
                  <option key={tier.score} value={tier.score}>
                    {tier.score}/10 — {tier.descriptor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Where To Watch
              </label>
              <input
                type="text"
                value={whereToWatch}
                onChange={(e) => setWhereToWatch(e.target.value)}
                placeholder="Amazon Prime / Apple TV"
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] shadow-2xs transition-all"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Personal Commentary / Why Watch
              </label>
              <textarea
                rows={3}
                value={personalCommentary}
                onChange={(e) => setPersonalCommentary(e.target.value)}
                placeholder="Explain why this film is unmissable right now..."
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] shadow-2xs transition-all"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
                Poster URL
              </label>
              <input
                type="text"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] shadow-2xs transition-all"
              />
            </div>

            <div className="md:col-span-3 flex items-center space-x-2.5">
              <input
                type="checkbox"
                checked={readyForNewsletter}
                onChange={(e) => setReadyForNewsletter(e.target.checked)}
                className="accent-[#008CFF] w-4 h-4 rounded"
                id="newsletter-chk"
              />
              <label htmlFor="newsletter-chk" className="text-xs font-mono text-gray-700 cursor-pointer">
                Include in Next Friday Newsletter Dispatch
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-mono font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Save Recommendation
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm flex space-x-3.5 hover:border-[#008CFF]/50 transition-all group"
          >
            <img
              src={item.posterUrl}
              alt={item.title}
              className="w-16 h-24 object-cover rounded-xl border border-gray-100 shrink-0 shadow-2xs"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-blue-50 text-[#008CFF] border border-blue-200 text-[10px] font-mono font-bold rounded-lg">
                    {normalizeScore(item.abstractScore)}/10 · {getQualityLabel(item.abstractScore)}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">{item.moodTag}</span>
                </div>
                <h4 className="font-serif font-bold text-sm text-gray-900 group-hover:text-[#008CFF] transition-colors mt-1.5">
                  {item.title}
                </h4>
                <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-relaxed">
                  {item.personalCommentary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                <span className="text-[10px] font-mono text-gray-400">{item.whereToWatch}</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 text-gray-500 hover:text-[#008CFF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
