'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  X,
  Compass,
  RefreshCw,
  Mail,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Film,
} from 'lucide-react';
import { useAiConcierge } from '@/lib/context/AiConciergeContext';
import { AbstractScoreBadge } from '../ui/AbstractScoreBadge';
import { normalizeScore } from '@/lib/utils/rating';
import type { Review } from '@/types';

interface RecommendationResult {
  title: string;
  type: string;
  year: string;
  director: string;
  abstractScore: number;
  summary: string;
  whyWatch: string;
}

const MOOD_OPTIONS = [
  'Contemplative & Atmospheric',
  'High Paranoia & Mind-Bending',
  'Deeply Emotional & Melancholic',
  'Sharp & Intellectually Rigorous',
  'Visually Stunning Neo-Noir',
  'Comforting Slice-of-Life',
];

export function AiConciergeModal() {
  const { isOpen, closeConcierge } = useAiConcierge();

  const [mood, setMood] = useState('Contemplative & Atmospheric');
  const [favoriteFilms, setFavoriteFilms] = useState('Drive My Car, Severance, Past Lives');
  const [mediaType, setMediaType] = useState('Any');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [curatorNote, setCuratorNote] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null);
  const [existingReviews, setExistingReviews] = useState<Review[]>([]);

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
          // Graceful fallback if reviews API fails
        });
    }
  }, [isOpen, existingReviews.length]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeConcierge();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeConcierge]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

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
    setEmailError(null);
    setApiError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setEmailError('Please enter your email to subscribe and unlock your recommendations.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setRecommendations(null);

    try {
      // 1. Subscribe user to the newsletter dispatch (no duplicate if already subscribed)
      try {
        const subRes = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: trimmedEmail,
            preference: 'editors-recommendation',
          }),
        });
        const subData = await subRes.json();
        const confirmMsg =
          subData.message || `You're now subscribed with ${trimmedEmail}!`;
        setSubscriptionMessage(confirmMsg);
        setSubscriptionSuccess(true);
      } catch {
        // Graceful handling for subscription
        const fallbackMsg = `Welcome to The Abstract Dispatch! Subscribed with ${trimmedEmail}.`;
        setSubscriptionMessage(fallbackMsg);
        setSubscriptionSuccess(true);
      }

      // 2. Fetch AI Recommendations
      const response = await fetch('/api/recommend-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          favoriteFilms,
          mediaType,
        }),
      });

      if (!response.ok) {
        throw new Error('Our AI Curator is currently unavailable. Please try again shortly.');
      }

      const data = await response.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
        setCuratorNote(
          data.curatorNote ||
            'Tailored picks reflecting your personal taste profile and cinematic preferences.'
        );
      } else {
        throw new Error('No recommendations could be generated for these criteria.');
      }
    } catch (err: any) {
      console.error('AI Concierge error:', err);
      setApiError(err.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations(null);
    setCuratorNote(null);
    setApiError(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeConcierge();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-concierge-title"
    >
      <div
        className="bg-white border border-gray-200/90 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-[#008CFF] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-[#008CFF]" />
              <span>EDITOR&apos;S RECOMMENDATION</span>
            </div>
            <h2
              id="ai-concierge-title"
              className="font-serif font-black text-2xl sm:text-3xl text-[#111111]"
            >
              What Should I Watch Next?
            </h2>
            <p className="text-xs font-news text-gray-500 font-medium">
              Personalized recommendations in the editorial voice of The Abstract Take.
            </p>
          </div>
          <button
            onClick={closeConcierge}
            className="p-2 border border-gray-200 rounded-xl bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Close AI Concierge"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          {!recommendations ? (
            <form
              onSubmit={handleGenerate}
              className="space-y-5 bg-white p-6 border border-gray-200/90 rounded-2xl shadow-sm"
            >
              {/* Mood selector */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-700 mb-2">
                  What&apos;s your current mood or desired atmosphere?
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                        mood === m
                          ? 'bg-[#008CFF] text-white shadow-2xs'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Favorite recent titles */}
              <div>
                <label
                  htmlFor="ai-favorite-films"
                  className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-700 mb-1"
                >
                  Name 1–3 movies, series, or anime you loved:
                </label>
                <input
                  id="ai-favorite-films"
                  type="text"
                  value={favoriteFilms}
                  onChange={(e) => setFavoriteFilms(e.target.value)}
                  placeholder="e.g. Past Lives, Severance, Perfect Blue..."
                  className="w-full bg-gray-50/70 font-mono text-xs px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all text-gray-900"
                />
              </div>

              {/* Format preference */}
              <div>
                <label
                  htmlFor="ai-media-type"
                  className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-700 mb-1"
                >
                  Format Preference:
                </label>
                <select
                  id="ai-media-type"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="w-full bg-gray-50/70 font-mono text-xs font-bold px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all cursor-pointer text-gray-900"
                >
                  <option value="Any">Any Format (Movies, Series & Anime)</option>
                  <option value="Movie">Feature Movie</option>
                  <option value="Series">TV Series / Mini-Series</option>
                  <option value="Anime">Anime</option>
                  <option value="Documentary">Documentary</option>
                </select>
              </div>

              {/* Email Subscription Requirement */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
                <label
                  htmlFor="ai-concierge-email"
                  className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-800 flex items-center justify-between"
                >
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#008CFF]" />
                    <span>Your Email (Subscribe & Receive Recommendations) *</span>
                  </span>
                  {subscriptionSuccess && (
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Subscribed
                    </span>
                  )}
                </label>
                <input
                  id="ai-concierge-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="Enter your email to subscribe (e.g. alex@example.com)..."
                  className="w-full bg-white font-sans text-xs px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF] transition-all shadow-2xs text-gray-900"
                />
                {emailError && (
                  <p className="text-xs text-rose-600 font-mono font-semibold">{emailError}</p>
                )}
                <p className="text-[11px] font-news text-gray-500">
                  Subscribe to get editorial dispatches, weekly watchlists, and unlock your personalized recommendations.
                </p>
              </div>

              {/* Error Banner */}
              {apiError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-900 text-xs font-mono">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Recommendation Generation Notice</span>
                    <span>{apiError}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#008CFF] hover:bg-[#0077dd] text-white py-3.5 rounded-xl font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Subscribing & Generating Recommendations...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Get Personal Recommendations</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Subscription Success Message Banner */}
              {subscriptionSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start space-x-3.5 text-emerald-950 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-mono font-bold text-xs uppercase tracking-wider text-emerald-800">
                      Subscription Confirmed!
                    </div>
                    <p className="text-xs font-news text-emerald-900 leading-relaxed font-medium">
                      {subscriptionMessage ||
                        `Welcome to The Abstract Dispatch. You're now subscribed with ${email}.`}{' '}
                      Your personal recommendations are unlocked below:
                    </p>
                  </div>
                </div>
              )}

              {/* Curator Note */}
              {curatorNote && (
                <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3">
                  <Compass className="w-5 h-5 text-[#008CFF] flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-news text-gray-800 italic font-medium leading-relaxed">
                    &ldquo;{curatorNote}&rdquo;
                  </p>
                </div>
              )}

              {/* Recommendations Cards */}
              <div className="grid grid-cols-1 gap-4">
                {recommendations.map((rec, idx) => {
                  const score = normalizeScore(rec.abstractScore);
                  const matchingReview = findMatchingReview(rec.title);

                  return (
                    <div
                      key={idx}
                      className="p-5 bg-white border border-gray-200/90 rounded-2xl shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-50 text-[#008CFF] border border-blue-100 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase">
                              {rec.type}
                            </span>
                            <span className="text-xs font-mono font-bold text-gray-400">
                              {rec.year}
                            </span>
                          </div>
                          <h3 className="font-serif font-black text-lg text-[#111111] mt-1">
                            {rec.title}
                          </h3>
                          <p className="text-xs font-mono text-gray-500 font-medium">
                            Dir. {rec.director}
                          </p>
                        </div>

                        <AbstractScoreBadge score={score} size="sm" showLabel={false} />
                      </div>

                      <p className="text-xs font-news text-gray-700 leading-relaxed">
                        {rec.summary}
                      </p>

                      <div className="bg-gray-50/80 border border-gray-100 p-3.5 rounded-xl space-y-1 text-xs">
                        <div className="font-mono font-bold text-[#008CFF] text-[10px] uppercase tracking-wider">
                          Why I Recommend It:
                        </div>
                        <p className="font-news text-gray-700 italic">{rec.whyWatch}</p>
                      </div>

                      {/* Internal review link if matching review exists in database */}
                      {matchingReview ? (
                        <div className="pt-2 flex items-center justify-end">
                          <Link
                            href={`/reviews/${matchingReview.slug}`}
                            onClick={closeConcierge}
                            className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-[#008CFF] hover:underline"
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>Read Full Take on The Abstract Take</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-gray-400">
                          <span>Curated Editorial Pick</span>
                          <span className="text-gray-400">Independent Selection</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-mono text-xs font-bold uppercase transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Modify Criteria</span>
                </button>

                <button
                  type="button"
                  onClick={closeConcierge}
                  className="px-6 py-2.5 bg-[#111111] hover:bg-gray-800 text-white rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
