import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Film } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <div className="inline-flex p-4 bg-gray-100 rounded-3xl mb-6">
        <Film className="w-12 h-12 text-gray-400" />
      </div>
      <h1 className="font-serif font-black text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">
        404 — Critique Not Found
      </h1>
      <p className="font-news text-lg text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
        The review, watchlist, or editorial take you are searching for does not exist or may have moved to a different archive.
      </p>
      <Link
        href="/"
        className="inline-flex items-center space-x-2 px-6 py-3 bg-[#008CFF] hover:bg-[#0077dd] text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Homepage</span>
      </Link>
    </div>
  );
}
