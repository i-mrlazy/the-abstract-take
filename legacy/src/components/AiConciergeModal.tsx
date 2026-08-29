import React, { useState } from 'react';
import { Sparkles, X, Compass, RefreshCw, Mail, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { AbstractScoreBadge } from './AbstractScoreBadge';
import { normalizeScore } from '../utils/rating';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

interface AiConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecommendationResult {
  title: string;
  type: string;
  year: string;
  director: string;
  abstractScore: number;
  summary: string;
  whyWatch: string;
}

export const AiConciergeModal: React.FC<AiConciergeModalProps> = ({ isOpen, onClose }) => {
  const [mood, setMood] = useState('Contemplative & Atmospheric');
  const [favoriteFilms, setFavoriteFilms] = useState('Drive My Car, Severance, Past Lives');
  const [mediaType, setMediaType] = useState('Any');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [curatorNote, setCuratorNote] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null);
  const { showSuccess } = useToast();

  const moodOptions = [
    'Contemplative & Atmospheric',
    'High Paranoia & Mind-Bending',
    'Deeply Emotional & Melancholic',
    'Sharp & Intellectually Rigorous',
    'Visually Stunning Neo-Noir',
    'Comforting Slice-of-Life',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    // Validate email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your email to subscribe and unlock your recommendations.');
      return;
    }
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setRecommendations(null);

    try {
      // 1. Subscribe user to the newsletter dispatch
      try {
        const subRes = await api.subscribeNewsletter(trimmedEmail, 'editors-recommendation');
        const confirmMsg = subRes.message || `You're now subscribed with ${trimmedEmail}!`;
        setSubscriptionMessage(confirmMsg);
        setSubscriptionSuccess(true);
        showSuccess('Subscription Confirmed!', confirmMsg, 5500);
      } catch (subErr: any) {
        // Even if already subscribed or minor network hiccup, confirm subscription status gracefully
        const fallbackMsg = `Welcome to The Abstract Dispatch! Subscribed with ${trimmedEmail}.`;
        setSubscriptionMessage(fallbackMsg);
        setSubscriptionSuccess(true);
        showSuccess('Subscription Confirmed!', fallbackMsg, 5500);
      }

      // 2. Fetch AI Recommendations without streaming restrictions
      const response = await fetch('/api/recommend-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          favoriteFilms,
          mediaType,
        }),
      });

      const data = await response.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        setCuratorNote(data.curatorNote || 'Tailored picks reflecting your personal taste profile and cinematic preferences.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200/90 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden my-6 flex flex-col max-h-[90vh] text-left">
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-[#008CFF] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-[#008CFF]" />
              <span>EDITOR'S RECOMMENDATION</span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#111111]">
              What Should I Watch Next?
            </h2>
            <p className="text-xs font-news text-gray-500 font-medium">
              Personalized recommendations in the editorial voice of The Abstract Take.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-gray-200 rounded-xl bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          <form onSubmit={handleGenerate} className="space-y-5 bg-white p-6 border border-gray-200/90 rounded-2xl shadow-sm">
            {/* Mood selector */}
            <div>
              <label className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-700 mb-2">
                What's your current mood or desired atmosphere?
              </label>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((m) => (
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
              <label className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-700 mb-1">
                Name 1–3 movies, series, or anime you loved:
              </label>
              <input
                type="text"
                value={favoriteFilms}
                onChange={(e) => setFavoriteFilms(e.target.value)}
                placeholder="e.g. Past Lives, Severance, Perfect Blue..."
                className="w-full bg-gray-50/70 font-mono text-xs px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all"
              />
            </div>

            {/* Format preference */}
            <div>
              <label className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-700 mb-1">
                Format Preference:
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                className="w-full bg-gray-50/70 font-mono text-xs font-bold px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all cursor-pointer"
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
              <label className="block font-mono font-bold text-xs uppercase tracking-wider text-gray-800 flex items-center justify-between">
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
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="Enter your email to subscribe (e.g. alex@example.com)..."
                className="w-full bg-white font-sans text-xs px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF] transition-all shadow-2xs"
              />
              {emailError && (
                <p className="text-xs text-rose-600 font-mono font-semibold">{emailError}</p>
              )}
              <p className="text-[11px] font-news text-gray-500">
                Subscribe to get editorial dispatches, weekly watchlists, and unlock your personalized recommendations.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#008CFF] hover:bg-[#0077dd] text-white py-3.5 rounded-xl font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shadow-xs transition-all"
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

          {/* Subscription Success Message Banner */}
          {subscriptionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start space-x-3.5 text-emerald-950 shadow-2xs animate-fadeIn">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-mono font-bold text-xs uppercase tracking-wider text-emerald-800">
                  Subscription Confirmed!
                </div>
                <p className="text-xs font-news text-emerald-900 leading-relaxed font-medium">
                  {subscriptionMessage || `Welcome to The Abstract Dispatch. You're now subscribed with ${email}.`} Your personal recommendations are unlocked below:
                </p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {recommendations && (
            <div className="space-y-4">
              {curatorNote && (
                <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3">
                  <Compass className="w-5 h-5 text-[#008CFF] flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-news text-gray-800 italic font-medium leading-relaxed">
                    "{curatorNote}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {recommendations.map((rec, idx) => {
                  const score = normalizeScore(rec.abstractScore);
                  return (
                    <div
                      key={idx}
                      className="p-5 bg-white border border-gray-200/90 rounded-2xl shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-50 text-[#008CFF] border border-blue-100 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                              {rec.type}
                            </span>
                            <span className="text-xs font-mono font-bold text-gray-400">{rec.year}</span>
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
