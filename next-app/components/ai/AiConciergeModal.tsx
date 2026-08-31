'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  X,
  Compass,
  RefreshCw,
  Mail,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Film,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { useAiConcierge } from '@/lib/context/AiConciergeContext';
import { AbstractScoreBadge } from '../ui/AbstractScoreBadge';
import { BookmarkButton } from '../bookmarks/BookmarkButton';
import { normalizeScore } from '@/lib/utils/rating';
import { TAXONOMY_GENRES, TAXONOMY_MOODS } from '@/lib/editorial/recommendationTaxonomy';
import type { Review } from '@/types';

interface RecommendationResult {
  title: string;
  type: string;
  year: string;
  director: string;
  abstractScore?: number;
  summary: string;
  whyWatch: string;
}

const POPULAR_GENRES = [
  'Romance',
  'Drama',
  'Science Fiction',
  'Thriller',
  'Mystery',
  'Crime',
  'Psychological',
  'Animation',
  'Comedy',
  'Horror',
  'Historical',
  'Documentary',
  'Action',
  'Coming-of-Age',
  'Fantasy',
];

const MOOD_PRESETS = [
  'Deeply Emotional & Melancholic',
  'High Paranoia & Mind-Bending',
  'Dark & Gritty',
  'Contemplative & Atmospheric',
  'Sharp & Intellectually Rigorous',
  'Visually Stunning & Dreamlike',
  'Warm, Comforting & Human',
  'Tense & Edge-of-Seat',
];

export function AiConciergeModal() {
  const { isOpen, closeConcierge } = useAiConcierge();
  const router = useRouter();

  // 4-Step Form State
  const [mediaType, setMediaType] = useState('Any');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Drama']);
  const [mood, setMood] = useState('Deeply Emotional & Melancholic');
  const [favoriteFilms, setFavoriteFilms] = useState('');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [curatorNote, setCuratorNote] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null);
  const [existingReviews, setExistingReviews] = useState<Review[]>([]);

  // Optional newsletter signup state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Fetch reviews for matching recommendations to existing review pages
  useEffect(() => {
    if (isOpen && existingReviews.length === 0) {
      fetch('/api/reviews')
        .then((res) => res.json())
        .then((data) => {
          if (data.reviews && Array.isArray(data.reviews)) {
            setExistingReviews(data.reviews);
          }
        })
        .catch(() => {
          // Graceful fallback
        });
    }
  }, [isOpen, existingReviews.length]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConcierge();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeConcierge]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const findMatchingReview = useCallback(
    (recTitle: string): Review | undefined => {
      if (!recTitle || existingReviews.length === 0) return undefined;
      const cleanRecTitle = recTitle
        .replace(/\s*\(\d{4}\).*/, '')
        .trim()
        .toLowerCase();

      return existingReviews.find((r) => {
        const cleanExistingTitle = r.title
          .replace(/\s*\(\d{4}\).*/, '')
          .trim()
          .toLowerCase();
        return (
          cleanExistingTitle === cleanRecTitle ||
          cleanExistingTitle.includes(cleanRecTitle) ||
          cleanRecTitle.includes(cleanExistingTitle)
        );
      });
    },
    [existingReviews]
  );

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setLoading(true);
    setRecommendations(null);

    try {
      const response = await fetch('/api/recommend-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          genres: selectedGenres,
          favoriteFilms: favoriteFilms.trim(),
          mediaType,
        }),
      });

      if (!response.ok) {
        throw new Error('Our recommendation curator is currently updating. Please try again.');
      }

      const data = await response.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
        setCuratorNote(data.curatorNote || null);
      } else {
        throw new Error('Could not generate recommendations for the given criteria.');
      }
    } catch (err: any) {
      setApiError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterLoading(true);
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail.trim().toLowerCase(),
          preference: 'editors-recommendation',
        }),
      });
      setNewsletterSubscribed(true);
    } catch {
      setNewsletterSubscribed(true);
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleViewFullResults = () => {
    const params = new URLSearchParams();
    if (mediaType && mediaType !== 'Any') params.set('type', mediaType);
    if (selectedGenres.length > 0) params.set('genre', selectedGenres.join(','));
    if (mood) params.set('mood', mood);
    if (favoriteFilms.trim()) params.set('q', favoriteFilms.trim());

    closeConcierge();
    router.push(`/recommends?${params.toString()}`);
  };

  const handleReset = () => {
    setRecommendations(null);
    setCuratorNote(null);
    setApiError(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeConcierge();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discovery-modal-title"
    >
      <div
        className="bg-white border border-gray-200/90 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-[#008CFF] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">
              <Compass className="w-3.5 h-3.5 text-[#008CFF]" />
              <span>THE ABSTRACT TAKE DISCOVERY</span>
            </div>
            <h2
              id="discovery-modal-title"
              className="font-serif font-black text-2xl sm:text-3xl text-gray-950"
            >
              What Should I Watch Next?
            </h2>
            <p className="text-xs font-news text-gray-500 font-medium">
              Structured recommendations curated strictly on artistic caliber and storytelling rigor.
            </p>
          </div>
          <button
            onClick={closeConcierge}
            className="p-2 border border-gray-200 rounded-xl bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Close Discovery Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          {!recommendations ? (
            <form
              onSubmit={handleGenerate}
              className="space-y-5 bg-white p-6 border border-gray-200/90 rounded-2xl shadow-xs"
            >
              {/* STEP 1: Format preference */}
              <div>
                <label
                  htmlFor="discovery-media-type"
                  className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-800 mb-1"
                >
                  Step 1: What format are you watching?
                </label>
                <select
                  id="discovery-media-type"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="w-full bg-gray-50/70 font-mono text-xs font-bold px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all cursor-pointer text-gray-900"
                >
                  <option value="Any">Any Format (Movies, Series & Anime)</option>
                  <option value="Movie">Feature Movies</option>
                  <option value="Series">TV Series</option>
                  <option value="Anime">Anime</option>
                  <option value="Documentary">Documentaries</option>
                  <option value="Mini-Series">Mini-Series</option>
                  <option value="Special">Specials & Standalone</option>
                </select>
              </div>

              {/* STEP 2: Genre selector */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-800 mb-2">
                  Step 2: What are you in the mood for? (Select Genres):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_GENRES.map((g) => {
                    const active = selectedGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-[#008CFF] text-white shadow-2xs'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Mood selector */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-800 mb-2">
                  Step 3: How do you want it to feel? (Atmosphere):
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
                        mood === m
                          ? 'bg-[#008CFF] text-white font-bold shadow-2xs'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 4: Reference Titles */}
              <div>
                <label
                  htmlFor="discovery-fav-films"
                  className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-800 mb-1"
                >
                  Step 4: Anything you already love? (Optional Taste Signals):
                </label>
                <input
                  id="discovery-fav-films"
                  type="text"
                  placeholder="e.g. Past Lives, Drive My Car, Mindhunter, Severance"
                  value={favoriteFilms}
                  onChange={(e) => setFavoriteFilms(e.target.value)}
                  className="w-full bg-gray-50/70 font-news text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all text-gray-900"
                />
              </div>

              {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Submit Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Curating Matches...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Show Me What To Watch</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleViewFullResults}
                  className="w-full sm:w-auto px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Explore Full Dossier
                </button>
              </div>
            </form>
          ) : (
            /* Results View */
            <div className="space-y-6">
              {curatorNote && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs font-news text-blue-950 leading-relaxed italic border-l-4 border-l-[#008CFF]">
                  &ldquo;{curatorNote}&rdquo;
                </div>
              )}

              {/* Recommendation Cards */}
              <div className="space-y-4">
                {recommendations.map((rec, index) => {
                  const matchingReview = findMatchingReview(rec.title);
                  const isReviewed = Boolean(matchingReview);
                  const score = isReviewed
                    ? normalizeScore(matchingReview!.abstractScore)
                    : Number(rec.abstractScore) || 9;

                  return (
                    <div
                      key={index}
                      className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:border-[#008CFF]/40 transition-all space-y-3 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2 text-xs font-mono text-gray-500 mb-1">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-bold">
                              {rec.type}
                            </span>
                            <span>•</span>
                            <span>{rec.year}</span>
                            <span>•</span>
                            <span className="truncate">Dir. {rec.director}</span>
                          </div>

                          <h3 className="font-serif font-black text-xl text-gray-950 leading-snug">
                            {rec.title}
                          </h3>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center space-x-2">
                          {isReviewed && (
                            <BookmarkButton reviewId={matchingReview!.id} variant="icon" />
                          )}
                          {isReviewed ? (
                            <AbstractScoreBadge score={score} size="sm" showLabel={false} />
                          ) : (
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-mono px-2 py-1 rounded-md uppercase tracking-wider font-bold">
                              Curated Pick
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-news text-gray-700 leading-relaxed">
                        {rec.summary}
                      </p>

                      {/* Explainability signal */}
                      <div className="bg-blue-50/60 border border-blue-100/80 rounded-xl p-3 text-left space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#008CFF] flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-[#008CFF]" />
                          <span>Why This Matches Your Taste:</span>
                        </span>
                        <p className="text-xs text-gray-700 leading-snug">
                          {rec.whyWatch}
                        </p>
                      </div>

                      {/* Review Link / Unreviewed indicator */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
                        {isReviewed ? (
                          <Link
                            href={`/reviews/${matchingReview!.slug}`}
                            onClick={closeConcierge}
                            className="font-bold text-[#008CFF] hover:underline flex items-center space-x-1"
                          >
                            <span>Read Full Take ({score}/10)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-gray-500 italic text-[11px]">
                            Not Yet Reviewed by The Abstract Take
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  Change Viewing Taste
                </button>

                <button
                  onClick={handleViewFullResults}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <span>Explore Results Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Optional Newsletter Opt-In */}
              <div className="pt-4 border-t border-gray-200">
                {!newsletterSubscribed ? (
                  <form
                    onSubmit={handleNewsletterSubscribe}
                    className="bg-gray-100/80 rounded-2xl p-4 text-left space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-[#008CFF]" />
                      <span className="font-mono text-xs font-bold text-gray-900">
                        Want personalized recommendations like this in your inbox?
                      </span>
                    </div>
                    <p className="text-[11px] font-news text-gray-600">
                      Receive our weekly curated cinema dossiers and uncompromised reviews. Zero spam.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="flex-1 bg-white font-mono text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF]"
                      />
                      <button
                        type="submit"
                        disabled={newsletterLoading}
                        className="bg-[#008CFF] hover:bg-[#0077dd] text-white font-mono text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {newsletterLoading ? 'Joining...' : 'Subscribe'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#008CFF] flex-shrink-0" />
                    <span>You’re subscribed! Future recommendation dossiers will arrive in your inbox.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
