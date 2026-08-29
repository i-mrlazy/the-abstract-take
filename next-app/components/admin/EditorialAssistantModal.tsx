'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  Flame,
  FileText,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  RotateCcw,
  Info,
  Shield,
  Loader2,
  BookOpen,
} from 'lucide-react';
import {
  RATING_SCALE,
  normalizeScore,
  getQualityLabel,
  getScoreMeaning,
  getRatingColorClasses,
} from '@/lib/utils/rating';
import { EditorialDraftResult, MediaType } from '@/types';

interface EditorialAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialYear?: number;
  initialType?: MediaType;
  initialScore?: number;
  initialRawTake?: string;
  initialLikes?: string[];
  initialDislikes?: string[];
  initialVerdict?: string;
  onApplyDraft: (draft: EditorialDraftResult) => void;
}

export function EditorialAssistantModal({
  isOpen,
  onClose,
  initialTitle = '',
  initialYear = new Date().getFullYear(),
  initialType = 'Movie',
  initialScore = 9,
  initialRawTake = '',
  initialLikes = [],
  initialDislikes = [],
  initialVerdict = '',
  onApplyDraft,
}: EditorialAssistantModalProps) {
  // Input State
  const [title, setTitle] = useState(initialTitle);
  const [year, setYear] = useState<number>(initialYear);
  const [contentType, setContentType] = useState<MediaType>(initialType);
  const [rating, setRating] = useState<number>(() => normalizeScore(initialScore));
  const [rawTake, setRawTake] = useState(initialRawTake);
  const [likes, setLikes] = useState(initialLikes.filter(Boolean).join('\n'));
  const [dislikes, setDislikes] = useState(initialDislikes.filter(Boolean).join('\n'));
  const [personalVerdict, setPersonalVerdict] = useState(initialVerdict);
  const [verifiedFacts, setVerifiedFacts] = useState('');
  const [contextualBackground, setContextualBackground] = useState('');

  // Generation & Result State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EditorialDraftResult | null>(null);

  // Sync with props when opened
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setYear(initialYear);
      setContentType(initialType);
      setRating(normalizeScore(initialScore));
      setRawTake(initialRawTake);
      setLikes(initialLikes.filter(Boolean).join('\n'));
      setDislikes(initialDislikes.filter(Boolean).join('\n'));
      setPersonalVerdict(initialVerdict);
      setError(null);
    }
  }, [isOpen, initialTitle, initialYear, initialType, initialScore, initialRawTake, initialLikes, initialDislikes, initialVerdict]);

  if (!isOpen) return null;

  const currentScoreNorm = normalizeScore(rating);
  const scoreColors = getRatingColorClasses(currentScoreNorm);
  const scoreLabel = getQualityLabel(currentScoreNorm);

  const wordCount = result?.editorialReview
    ? result.editorialReview.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !rawTake.trim()) {
      setError('Please provide at least a Title or your Creator Raw Take.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/editorial-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          year,
          contentType,
          rating: currentScoreNorm,
          rawTake: rawTake.trim(),
          likes: likes.trim(),
          dislikes: dislikes.trim(),
          personalVerdict: personalVerdict.trim(),
          verifiedFacts: verifiedFacts.trim(),
          contextualBackground: contextualBackground.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to generate editorial review.');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Editorial Assistant Error:', err);
      setError(err.message || 'Failed to generate editorial review. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadSample = () => {
    setTitle('Dune: Part Two');
    setYear(2024);
    setContentType('Movie');
    setRating(10);
    setRawTake(
      'A monumental sci-fi tragedy where spectacle never overshadows the terrifying corruptive weight of charismatic prophecy. Denis Villeneuve achieves a rare balance of epic scale and intimate psychological dread.'
    );
    setLikes(
      "Greig Fraser's immersive IMAX 70mm cinematography\nHans Zimmer's visceral percussion & electronic soundscape\nAustin Butler's chilling, psychotic Feyd-Rautha performance\nDeliberate thematic deconstruction of the savior myth"
    );
    setDislikes(
      'Final 15 minutes of tactical battles feel slightly accelerated compared to the measured buildup'
    );
    setPersonalVerdict(
      'A towering modern cinematic classic that redefines large-scale speculative fiction and demands the largest screen possible.'
    );
    setVerifiedFacts(
      "Adapted from the second half of Frank Herbert's 1965 novel. Shot entirely on ARRI Alexa LF digital IMAX cameras."
    );
    setContextualBackground(
      'Direct continuation of the 2021 film, concluding the Paul Atreides rise to power narrative arc.'
    );
    setError(null);
  };

  const handleApply = () => {
    if (!result) return;
    onApplyDraft(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#008CFF]/20 text-[#008CFF] rounded-xl border border-[#008CFF]/30">
              <Sparkles className="w-5 h-5 text-[#008CFF]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif font-black text-lg tracking-tight text-white">
                  The Abstract Take — Editorial Writing Assistant
                </h2>
                <span className="px-2 py-0.5 bg-[#008CFF] text-white text-[10px] font-mono font-bold rounded-md">
                  AI Editorial Engine
                </span>
              </div>
              <p className="text-xs text-gray-400 font-sans">
                Transforms creator notes, rating, and verified facts into a polished ~250–300 word critique.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!result && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono rounded-lg transition-colors cursor-pointer border border-gray-700"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#008CFF]" />
                <span>Load Sample Notes</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editorial Hierarchy Banner */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0">
          <div className="flex items-center space-x-2 text-gray-700">
            <Shield className="w-4 h-4 text-[#008CFF] shrink-0" />
            <span className="font-bold text-gray-900">EDITORIAL HIERARCHY:</span>
            <span className="text-[#008CFF] font-bold">1. Creator Opinion (Authoritative)</span>
            <span className="text-gray-400">›</span>
            <span className="text-gray-700">2. Verified Facts</span>
            <span className="text-gray-400">›</span>
            <span className="text-gray-500">3. Contextual Research</span>
          </div>
          <span className="text-[11px] text-gray-500 italic hidden md:inline">
            Rating strictly preserved · No SEO fluff · ~250–300 words
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <Info className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            /* Input Form View */
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Row 1: Title, Year, Media Type, Authoritative Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50/70 border border-gray-200/80 rounded-xl">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dune: Part Two"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-[#008CFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-[#008CFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as MediaType)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-[#008CFF] focus:outline-none cursor-pointer"
                  >
                    <option value="Movie">Movie</option>
                    <option value="Series">TV Series</option>
                    <option value="Mini Series">Mini Series</option>
                    <option value="Anime">Anime</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Special">Special</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1 flex items-center justify-between">
                    <span>Creator Rating *</span>
                    <span className="text-[10px] text-[#008CFF] font-semibold">Authoritative</span>
                  </label>
                  <select
                    value={currentScoreNorm}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono font-bold text-gray-900 focus:border-[#008CFF] focus:outline-none cursor-pointer"
                  >
                    {RATING_SCALE.map((s) => (
                      <option key={s.score} value={s.score}>
                        {s.score}/10 — {s.descriptor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Authoritative Rating Badge Note */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs ${scoreColors.badgeBg} ${scoreColors.badgeText} border ${scoreColors.border}`}>
                    {currentScoreNorm}/10 · {scoreLabel.toUpperCase()}
                  </span>
                  <span className="text-gray-600 italic">"{getScoreMeaning(currentScoreNorm)}"</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">Rating is never overridden</span>
              </div>

              {/* Creator Raw Take (Primary Input) */}
              <div>
                <label className="block text-xs font-mono uppercase text-gray-900 font-bold mb-1.5 flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Creator Raw Take & Core Observations *</span>
                </label>
                <textarea
                  rows={4}
                  value={rawTake}
                  onChange={(e) => setRawTake(e.target.value)}
                  placeholder="Your unfiltered thoughts, gut reactions, aesthetic impressions, director execution, pacing notes, emotional resonances..."
                  required
                  className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none transition-all"
                />
              </div>

              {/* Likes & Dislikes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-emerald-800 font-bold mb-1.5 flex items-center space-x-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Things Liked (Specific Strengths)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={likes}
                    onChange={(e) => setLikes(e.target.value)}
                    placeholder="e.g. Sound design, lead performance, practical sets, tension in the third act (one per line or comma separated)..."
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-emerald-200/80 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-rose-800 font-bold mb-1.5 flex items-center space-x-1.5">
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>Things Disliked (Specific Critiques)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={dislikes}
                    onChange={(e) => setDislikes(e.target.value)}
                    placeholder="e.g. Slightly rushed pacing at the end, underwritten secondary character, jarring CGI shot..."
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-rose-200/80 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Personal Verdict */}
              <div>
                <label className="block text-xs font-mono uppercase text-gray-800 font-bold mb-1.5 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#008CFF]" />
                  <span>Personal Verdict (Closing Takeaway)</span>
                </label>
                <input
                  type="text"
                  value={personalVerdict}
                  onChange={(e) => setPersonalVerdict(e.target.value)}
                  placeholder="e.g. A towering modern sci-fi tragedy that demands the biggest screen possible."
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>

              {/* Optional Facts & Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-600 font-semibold mb-1">
                    Verified Factual Information (Optional)
                  </label>
                  <input
                    type="text"
                    value={verifiedFacts}
                    onChange={(e) => setVerifiedFacts(e.target.value)}
                    placeholder="e.g. Shot in 70mm IMAX, Hans Zimmer score, adaptation of 1965 novel"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-600 font-semibold mb-1">
                    Contextual Background (Optional)
                  </label>
                  <input
                    type="text"
                    value={contextualBackground}
                    onChange={(e) => setContextualBackground(e.target.value)}
                    placeholder="e.g. Follow-up to 2021 Part One, director's third feature in the genre"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-mono text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-mono font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Review (~250–300 words)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Polished Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Generated Review Preview & Apply Screen */
            <div className="space-y-6 animate-fadeIn">
              {/* Top Result Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-sm text-gray-900">
                      Editorial Review Generated
                    </h3>
                    <p className="text-xs text-emerald-800">
                      {wordCount} words · Strictly follows creator rating ({currentScoreNorm}/10) & observations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-mono font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Modify Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-1.5 bg-[#008CFF] hover:bg-[#0077dd] text-white rounded-lg text-xs font-mono font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Review Editor</span>
                  </button>
                </div>
              </div>

              {/* Review Content Card */}
              <div className="bg-gray-50/70 border border-gray-200 rounded-2xl p-6 space-y-5">
                {/* Headline & Score Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">
                      Editorial Headline
                    </span>
                    <h2 className="font-serif font-black text-lg text-gray-900 mt-0.5">
                      {result.headline}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase border ${scoreColors.badgeBg} ${scoreColors.badgeText} ${scoreColors.border}`}>
                      {scoreLabel}
                    </span>
                    <div className={`px-3 py-1 ${scoreColors.bg} ${scoreColors.text} rounded-xl font-serif font-black text-lg shadow-xs`}>
                      {currentScoreNorm}/10
                    </div>
                  </div>
                </div>

                {/* "My Take" Hook */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold text-[#008CFF] uppercase mb-1">
                    <span>★</span>
                    <span>Core Editorial Thesis ("My Take" Hook)</span>
                  </div>
                  <p className="font-serif font-bold text-sm text-gray-900 leading-snug">
                    "{result.myTakeHook}"
                  </p>
                </div>

                {/* Main Long-Form Review */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-gray-800 font-bold flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#008CFF]" />
                      <span>Polished Review Body</span>
                    </span>
                    <span className="text-[11px] font-mono text-gray-500">
                      {wordCount} words
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-800 font-serif text-sm leading-relaxed whitespace-pre-line pt-2">
                    {result.editorialReview}
                  </div>
                </div>

                {/* Pros & Cons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                    <h4 className="text-xs font-mono font-bold text-emerald-800 uppercase flex items-center space-x-1.5 mb-2">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Key Highlights (Liked)</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {result.pros.map((pro, i) => (
                        <li key={i} className="text-xs text-emerald-950 flex items-start space-x-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4">
                    <h4 className="text-xs font-mono font-bold text-rose-800 uppercase flex items-center space-x-1.5 mb-2">
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Critiques (Disliked)</span>
                    </h4>
                    {result.cons.length > 0 ? (
                      <ul className="space-y-1.5">
                        {result.cons.map((con, i) => (
                          <li key={i} className="text-xs text-rose-950 flex items-start space-x-2">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No significant flaws noted.</p>
                    )}
                  </div>
                </div>

                {/* Final Verdict */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">
                      Authoritative Verdict
                    </span>
                    <p className="font-serif font-bold text-sm text-gray-900 mt-0.5">
                      {result.verdictText}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-[#008CFF] border border-blue-200 text-xs font-mono font-bold rounded-lg uppercase shrink-0">
                    {result.shouldYouWatch}
                  </span>
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-4 py-2.5 text-xs font-mono text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Edit Input Notes
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-6 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-mono font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply to Review Editor</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
