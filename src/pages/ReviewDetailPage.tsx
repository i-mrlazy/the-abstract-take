import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Review, Comment } from '../types';
import { AbstractScoreBadge } from '../components/AbstractScoreBadge';
import { AdUnit } from '../components/AdUnit';
import { NotFoundPage } from './NotFoundPage';
import { api } from '../utils/api';
import { Bookmark, Heart, Share2, Eye, EyeOff, Tv, Clock, User, ChevronLeft, MessageSquare, Sparkles, Check, ThumbsUp, Type, Moon, Sun, ArrowUpRight, ShieldAlert, Film, Loader2 } from 'lucide-react';
import { getQualityLabel, normalizeScore } from '../utils/rating';

interface ReviewDetailPageProps {
  review?: Review | null;
  onBack?: () => void;
  onSelectReview?: (review: Review) => void;
  allReviews?: Review[];
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
}

export const ReviewDetailPage: React.FC<ReviewDetailPageProps> = ({
  review: initialReview,
  onBack,
  onSelectReview,
  allReviews = [],
  isBookmarked: initialIsBookmarked,
  onToggleBookmark,
  isLiked: initialIsLiked,
  onToggleLike,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [review, setReview] = useState<Review | null>(initialReview || null);
  const [loading, setLoading] = useState<boolean>(!initialReview && Boolean(slug));
  const [notFound, setNotFound] = useState<boolean>(false);

  const [showSpoilers, setShowSpoilers] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [readingModeDark, setReadingModeDark] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Local comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Resolve Review from slug or prop
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (initialReview && (!slug || initialReview.slug === slug || initialReview.id === slug)) {
      setReview(initialReview);
      setLoading(false);
      setNotFound(false);
      return;
    }

    if (!slug) {
      if (!initialReview) setNotFound(true);
      return;
    }

    // Try finding in allReviews array first
    const found = allReviews.find((r) => r.slug === slug || r.id === slug);
    if (found) {
      setReview(found);
      setLoading(false);
      setNotFound(false);
      return;
    }

    // Otherwise fetch dynamically from API
    setLoading(true);
    api.getReview(slug)
      .then((data) => {
        if (data) {
          setReview(data);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load review by slug:', err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug, initialReview, allReviews]);

  // Load comments
  useEffect(() => {
    if (review?.id) {
      api.getComments()
        .then((all) => {
          const matching = all.filter((c) => c.reviewId === review.id);
          if (matching.length > 0) {
            setComments(matching);
          } else {
            setComments([
              {
                id: 'c1',
                reviewId: review.id,
                userName: 'Alex Turner',
                content: `Your take on the pacing and visual symbolism is spot on. Refreshing to read an honest critique that doesn't feel manufactured by studio PR.`,
                createdAt: '3 hours ago',
                likes: 8,
                status: 'approved',
              },
            ]);
          }
        })
        .catch(() => {});
    }
  }, [review?.id]);

  // Scroll progress listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 text-[#008CFF] animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
          Retrieving Cinematic Analysis...
        </span>
      </div>
    );
  }

  if (notFound || !review) {
    return <NotFoundPage message={`The review "${slug || ''}" could not be located in The Abstract Take archive.`} />;
  }

  const isBookmarked = initialIsBookmarked !== undefined ? initialIsBookmarked : false;
  const isLiked = initialIsLiked !== undefined ? initialIsLiked : false;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim()) return;

    try {
      const added = await api.addComment(review.id, newCommentName, newCommentText);
      setComments([added, ...comments]);
      setNewCommentName('');
      setNewCommentText('');
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/reviews');
    }
  };

  const fontClasses = {
    normal: 'text-base sm:text-lg leading-relaxed',
    large: 'text-lg sm:text-xl leading-relaxed',
    xlarge: 'text-xl sm:text-2xl leading-relaxed',
  };

  const relatedReviews = allReviews.filter((r) => r.id !== review.id).slice(0, 3);
  const qualityLabel = getQualityLabel(review.abstractScore);

  return (
    <div className={`min-h-screen transition-colors duration-200 text-left ${readingModeDark ? 'bg-[#111111] text-white' : 'bg-[#FAF9F6] text-[#111111]'}`}>
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-[#008CFF] z-50 transition-all duration-75 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Breadcrumb & Reading Controls Bar */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${readingModeDark ? 'bg-[#111111]/90 border-gray-800' : 'bg-[#FAF9F6]/90 border-gray-200/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <button
            onClick={handleBack}
            className={`inline-flex items-center space-x-1.5 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${readingModeDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Archive</span>
          </button>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Dark Reading Mode Toggle */}
            <button
              onClick={() => setReadingModeDark(!readingModeDark)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${readingModeDark ? 'border-gray-700 text-yellow-400 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              title={readingModeDark ? 'Switch to Light mode' : 'Switch to Focus Dark mode'}
            >
              {readingModeDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Font Size Selector */}
            <div className={`flex items-center space-x-1 border rounded-lg p-0.5 ${readingModeDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 text-xs font-mono rounded ${fontSize === 'normal' ? 'bg-[#008CFF] text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 text-sm font-mono font-bold rounded ${fontSize === 'large' ? 'bg-[#008CFF] text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                A+
              </button>
            </div>

            {/* Bookmark Button */}
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(review.id)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isBookmarked ? 'border-[#008CFF] bg-blue-50 text-[#008CFF]' : readingModeDark ? 'border-gray-800 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                title="Bookmark Take"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Like Button */}
            {onToggleLike && (
              <button
                onClick={() => onToggleLike(review.id)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isLiked ? 'border-rose-500 bg-rose-50 text-rose-500' : readingModeDark ? 'border-gray-800 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                title="Like Take"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className={`p-1.5 rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${readingModeDark ? 'border-gray-800 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              title="Copy link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Cinematic Header */}
      <div className="relative border-b border-gray-200/90 overflow-hidden">
        {/* Banner Backdrop with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={review.bannerUrl || review.posterUrl}
            alt={review.title}
            className="w-full h-full object-cover filter brightness-[0.22] contrast-[1.1] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pb-20 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            {/* Poster & Quick Stats */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start space-y-4">
              <div className="relative w-48 sm:w-56 lg:w-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                <img
                  src={review.posterUrl}
                  alt={review.title}
                  className="w-full aspect-[2/3] object-cover"
                />
                <div className="absolute top-3 right-3">
                  <AbstractScoreBadge score={review.abstractScore} size="lg" />
                </div>
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#008CFF] text-white text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-md">
                  {review.type}
                </span>
                <span className="bg-white/10 text-gray-300 text-xs font-mono font-bold px-3 py-1 rounded-md backdrop-blur-xs">
                  {review.releaseYear}
                </span>
                <span className="bg-white/10 text-gray-300 text-xs font-mono font-bold px-3 py-1 rounded-md backdrop-blur-xs">
                  {review.runtime}
                </span>
                <span className="bg-white/10 text-gray-300 text-xs font-mono font-bold px-3 py-1 rounded-md backdrop-blur-xs">
                  {review.director}
                </span>
              </div>

              <h1 className="font-serif font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
                {review.title}
              </h1>

              {/* Creator Raw Take Summary Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2 text-left">
                <div className="flex items-center space-x-2 text-[#00C0FF] text-[11px] font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Abstract Verdict: {normalizeScore(review.abstractScore)}/10 — {qualityLabel}</span>
                </div>
                <p className="font-news text-base sm:text-lg text-gray-100 font-medium italic leading-relaxed">
                  "{review.myTake}"
                </p>
              </div>

              {/* Author & Published Date */}
              <div className="flex items-center space-x-3 pt-2 text-xs font-mono text-gray-300">
                <img
                  src={review.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'}
                  alt={review.author?.name || 'The Abstract Take'}
                  className="w-8 h-8 rounded-full object-cover border border-white/30"
                />
                <div>
                  <span className="font-bold text-white block">{review.author?.name || 'The Abstract Take'}</span>
                  <span className="text-gray-400">{review.author?.title || 'Film Critic'} · {review.publishDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Body Grid */}
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Article Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Pros and Cons Box */}
            <div className={`p-6 sm:p-8 rounded-2xl border ${readingModeDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200/90 shadow-sm'} space-y-6`}>
              <h3 className="font-serif font-black text-xl text-[#111111] border-b border-gray-200 pb-3 flex items-center justify-between">
                <span className={readingModeDark ? 'text-white' : 'text-[#111111]'}>Key Editorial Takeaways</span>
                <span className="text-xs font-mono font-bold text-[#008CFF] uppercase tracking-wider">
                  Abstract Score: {normalizeScore(review.abstractScore)}/10
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Pros */}
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold uppercase text-emerald-600 tracking-wider flex items-center space-x-1.5">
                    <Check className="w-4 h-4" />
                    <span>What Worked</span>
                  </span>
                  <ul className="space-y-2 text-xs font-news leading-relaxed">
                    {review.pros.map((pro, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-emerald-500 font-bold shrink-0">•</span>
                        <span className={readingModeDark ? 'text-gray-300' : 'text-gray-700'}>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold uppercase text-rose-500 tracking-wider flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>What Didn't</span>
                  </span>
                  <ul className="space-y-2 text-xs font-news leading-relaxed">
                    {review.cons.length > 0 ? (
                      review.cons.map((con, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-rose-500 font-bold shrink-0">•</span>
                          <span className={readingModeDark ? 'text-gray-300' : 'text-gray-700'}>{con}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400 italic">No significant flaws observed.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Long-Form Written Critique */}
            <div className={`prose max-w-none space-y-6 font-news ${fontClasses[fontSize]} ${readingModeDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {review.longFormReview.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Favorite Scene & Quote Highlights */}
            {(review.favoriteScene || review.favoriteQuote) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {review.favoriteScene && (
                  <div className={`p-5 rounded-xl border ${readingModeDark ? 'bg-gray-900 border-gray-800' : 'bg-blue-50/50 border-blue-100'} space-y-2`}>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#008CFF] block">
                      STANDOUT SEQUENCE
                    </span>
                    <p className="font-news text-sm font-medium text-gray-800 italic">
                      "{review.favoriteScene}"
                    </p>
                  </div>
                )}

                {review.favoriteQuote && (
                  <div className={`p-5 rounded-xl border ${readingModeDark ? 'bg-gray-900 border-gray-800' : 'bg-purple-50/50 border-purple-100'} space-y-2`}>
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-600 block">
                      MEMORABLE QUOTE
                    </span>
                    <p className="font-serif italic text-sm text-gray-800">
                      "{review.favoriteQuote}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Spoilers Accordion */}
            {review.spoilerSection && (
              <div className="border border-amber-300 bg-amber-50/70 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-900 font-mono text-xs font-bold uppercase">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Spoiler Analysis & Ending Breakdown</span>
                  </div>
                  <button
                    onClick={() => setShowSpoilers(!showSpoilers)}
                    className="text-xs font-mono font-bold bg-amber-200/80 hover:bg-amber-300 text-amber-900 px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    {showSpoilers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSpoilers ? 'Hide Spoilers' : 'Reveal Spoilers'}</span>
                  </button>
                </div>

                {showSpoilers ? (
                  <p className="font-news text-sm text-amber-950 leading-relaxed pt-2 border-t border-amber-200">
                    {review.spoilerSection}
                  </p>
                ) : (
                  <p className="font-news text-xs text-amber-800 italic">
                    Click reveal to view full climax analysis and deep spoiler discussion.
                  </p>
                )}
              </div>
            )}

            {/* Final Verdict Summary Card */}
            <div className="p-8 bg-[#111111] text-white rounded-2xl space-y-4 shadow-xl border border-gray-800 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#00C0FF]">
                  FINAL EDITORIAL VERDICT
                </span>
                <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full text-gray-300">
                  {review.shouldYouWatch}
                </span>
              </div>
              <p className="font-news text-xl text-gray-100 leading-relaxed font-medium">
                {review.verdictText}
              </p>
            </div>

            {/* Comments Section */}
            <div className={`p-6 sm:p-8 rounded-2xl border ${readingModeDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200/90 shadow-sm'} space-y-6`}>
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-[#008CFF]" />
                  <h3 className={`font-serif font-black text-xl ${readingModeDark ? 'text-white' : 'text-[#111111]'}`}>
                    Discussion & Reader Takes ({comments.length})
                  </h3>
                </div>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={newCommentName}
                    onChange={(e) => setNewCommentName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#008CFF] ${readingModeDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
                    required
                  />
                </div>
                <textarea
                  placeholder="Share your thoughts, agreements, or counter-critique..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#008CFF] ${readingModeDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
                  required
                />
                <button
                  type="submit"
                  className="bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Post Comment
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-4 pt-4 border-t border-gray-200/80">
                {comments.map((c) => (
                  <div key={c.id} className={`p-4 rounded-xl border ${readingModeDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50/70 border-gray-200/80'} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs font-bold ${readingModeDark ? 'text-white' : 'text-gray-900'}`}>{c.userName}</span>
                      <span className="text-[10px] font-mono text-gray-400">{c.createdAt}</span>
                    </div>
                    <p className={`font-news text-xs leading-relaxed ${readingModeDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Streaming, Metadata & Related */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Where to Stream Card */}
            <div className={`p-6 rounded-2xl border ${readingModeDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200/90 shadow-sm'} space-y-4`}>
              <div className="flex items-center space-x-2 text-gray-900 border-b border-gray-200 pb-3">
                <Tv className="w-4 h-4 text-[#008CFF]" />
                <h4 className={`font-serif font-black text-base ${readingModeDark ? 'text-white' : 'text-[#111111]'}`}>Where to Stream</h4>
              </div>

              <div className="space-y-2">
                {review.streamingPlatforms.map((p, i) => (
                  <a
                    key={i}
                    href={p.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${readingModeDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' : 'bg-gray-50 border-gray-200/80 hover:bg-white hover:border-[#008CFF] text-gray-900'}`}
                  >
                    <span className="font-medium text-xs">{p.name}</span>
                    <span className="text-[10px] font-mono uppercase text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded">
                      {p.type}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Media Information Card */}
            <div className={`p-6 rounded-2xl border ${readingModeDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200/90 shadow-sm'} space-y-4 text-xs font-news`}>
              <h4 className={`font-serif font-black text-base border-b border-gray-200 pb-2 ${readingModeDark ? 'text-white' : 'text-[#111111]'}`}>
                Production Details
              </h4>
              <div className="space-y-2.5">
                <div>
                  <span className="text-gray-400 font-mono text-[10px] uppercase block">Director</span>
                  <span className={`font-bold ${readingModeDark ? 'text-gray-200' : 'text-gray-800'}`}>{review.director}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-mono text-[10px] uppercase block">Principal Cast</span>
                  <span className={readingModeDark ? 'text-gray-300' : 'text-gray-700'}>{review.cast.join(', ')}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-mono text-[10px] uppercase block">Genres</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {review.genres.map((g, i) => (
                      <Link
                        key={i}
                        to={`/category/${g.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        className="text-[10px] font-mono bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-0.5 rounded transition-colors"
                      >
                        {g}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Related Reviews */}
            {relatedReviews.length > 0 && (
              <div className={`p-6 rounded-2xl border ${readingModeDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200/90 shadow-sm'} space-y-4`}>
                <h4 className={`font-serif font-black text-base border-b border-gray-200 pb-2 ${readingModeDark ? 'text-white' : 'text-[#111111]'}`}>
                  Related Takes
                </h4>

                <div className="space-y-2.5">
                  {relatedReviews.map((r) => (
                    <Link
                      key={r.id}
                      to={`/reviews/${r.slug}`}
                      className={`p-3 rounded-xl border flex gap-3 transition-all ${readingModeDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-50/70 border-gray-200/80 hover:bg-white hover:border-[#008CFF] hover:shadow-md'}`}
                    >
                      <img
                        src={r.posterUrl}
                        alt={r.title}
                        className="w-14 h-20 object-cover border border-gray-200 rounded-lg shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <span className="text-[8px] font-mono font-bold uppercase bg-gray-900 text-white px-1.5 py-0.5 rounded">
                          {r.type}
                        </span>
                        <h5 className={`font-serif font-bold text-sm truncate ${readingModeDark ? 'text-white' : 'text-[#111111]'}`}>{r.title}</h5>
                        <span className="text-[10px] font-mono font-bold text-[#008CFF] block">
                          {normalizeScore(r.abstractScore)}/10 · {getQualityLabel(r.abstractScore)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Back CTA */}
            <div className={`p-5 rounded-2xl border text-center space-y-2 ${readingModeDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200/90 shadow-sm'}`}>
              <span className="text-[10px] font-mono font-bold uppercase text-gray-400 block">
                EXPLORE MORE CRITIQUE
              </span>
              <button
                onClick={handleBack}
                className="w-full bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                ← Back to Archive
              </button>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
};
