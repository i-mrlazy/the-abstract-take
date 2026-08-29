'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Eye } from 'lucide-react';

interface SpoilerSectionProps {
  content: string;
}

export function SpoilerSection({ content }: SpoilerSectionProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!content || content.trim().length === 0) return null;

  return (
    <div className="my-8 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-2xl p-6 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-amber-900">
          <div className="p-2 bg-amber-100 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="font-serif font-black text-base text-gray-900">
              Spoiler Analysis & Deconstruction
            </h4>
            <p className="font-mono text-xs text-amber-800">
              Contains key plot revelations, endings, and narrative twists.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isRevealed ? 'Hide Spoilers' : 'Reveal Spoilers'}</span>
          {isRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isRevealed && (
        <div className="mt-6 pt-6 border-t border-amber-200/80 font-news text-base text-gray-800 leading-relaxed whitespace-pre-line animate-in fade-in duration-300">
          {content}
        </div>
      )}
    </div>
  );
}
