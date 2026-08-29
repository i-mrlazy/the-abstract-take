import React, { useState } from 'react';
import { Plus, Trash2, Tag, Layers } from 'lucide-react';

interface TagsManagerProps {
  tags: string[];
  onAddTag: (tag: string) => Promise<void>;
  onDeleteTag: (tag: string) => Promise<void>;
}

export function TagsManager({ tags, onAddTag, onDeleteTag }: TagsManagerProps) {
  const [newTag, setNewTag] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    await onAddTag(newTag.trim());
    setNewTag('');
  };

  return (
    <div className="space-y-6 text-gray-900 max-w-4xl">
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm">
        <h2 className="font-serif font-black text-xl text-gray-900">Taxonomy, Editorial Tags & Genres</h2>
        <p className="text-xs text-gray-500 mt-1">
          Manage the global pool of tags and themes used across reviews, filters, and watchlists.
        </p>
      </div>

      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="New tag (e.g. Neo-Noir, A24, Cannes 2024, Criterion)..."
            className="flex-1 px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-mono font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tag</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2.5">
          {tags.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-gray-50/80 border border-gray-200 hover:border-[#008CFF] rounded-xl text-xs font-mono text-gray-700 hover:text-gray-900 transition-all group shadow-2xs"
            >
              <Tag className="w-3 h-3 text-[#008CFF]" />
              <span className="font-medium">{tag}</span>
              <button
                type="button"
                onClick={() => onDeleteTag(tag)}
                className="text-gray-400 hover:text-red-500 ml-1.5 font-bold cursor-pointer transition-colors"
                title={`Delete ${tag}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
