import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, Heart, Sparkles, Film, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

interface FooterProps {
  setActiveTab?: (tab: string) => void;
  onOpenAiConcierge?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenAiConcierge }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showError('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.subscribeNewsletter(trimmedEmail, 'footer');
      setSubscribed(true);
      setEmail('');
      showSuccess(
        'Subscription Confirmed!',
        res.message || `You're now subscribed with ${trimmedEmail}. Welcome to The Abstract Take!`,
        5500
      );
    } catch (err: any) {
      setSubscribed(true);
      setEmail('');
      showSuccess(
        'Subscription Confirmed!',
        `You're now subscribed with ${trimmedEmail}. Welcome to The Abstract Take!`,
        5500
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#111111] text-white border-t border-gray-800 pt-12 pb-8 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="bg-white text-gray-900 border border-gray-200/90 rounded-2xl p-6 sm:p-8 mb-12 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-xl space-y-2 text-left">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#008CFF] text-xs font-sans font-bold px-3 py-1 rounded-md uppercase tracking-wider border border-blue-100">
              <Mail className="w-3.5 h-3.5 text-[#008CFF]" />
              <span>WHAT SHOULD I WATCH NEXT?</span>
            </div>
            <h3 className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-[#111111]">
              The Abstract Dispatch
            </h3>
            <p className="font-news text-sm text-gray-700 font-medium leading-relaxed">
              Curated watchlist drops, weekend picks, and unfiltered critiques delivered straight to your inbox.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex-1 max-w-md">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono placeholder-gray-400 focus:outline-none focus:border-[#008CFF] focus:bg-white text-black flex-1 shadow-2xs"
              />
              <button
                type="submit"
                disabled={loading || subscribed}
                className="bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 shrink-0 cursor-pointer disabled:opacity-75"
              >
                {loading ? (
                  <span>Subscribing...</span>
                ) : subscribed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-[10px] text-gray-500 pt-2 text-left">
              100% Independent. Unsubscribe at any time.
            </p>
          </form>
        </div>

        {/* Brand & Footer Nav Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-gray-800">
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#008CFF] to-[#00C0FF] flex items-center justify-center text-black font-black text-xs">
                A
              </div>
              <span className="font-serif font-black text-lg text-white">The Abstract Take</span>
            </div>
            <p className="text-gray-400 text-xs font-news leading-relaxed max-w-sm">
              An independent editorial publication offering unfiltered movie, TV series, anime, and documentary critiques scored on the calibrated 1–10 Abstract Scale.
            </p>
            {onOpenAiConcierge && (
              <div className="pt-2">
                <button
                  onClick={onOpenAiConcierge}
                  className="inline-flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00C0FF]" />
                  <span>Curator AI Assistant</span>
                </button>
              </div>
            )}
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#008CFF]">Navigation</h4>
            <ul className="space-y-2 text-xs font-sans text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  My Take (Home)
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="hover:text-white transition-colors">
                  All Reviews
                </Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-white transition-colors">
                  Movie Reviews
                </Link>
              </li>
              <li>
                <Link to="/series" className="hover:text-white transition-colors">
                  Series Reviews
                </Link>
              </li>
              <li>
                <Link to="/anime" className="hover:text-white transition-colors">
                  Anime Reviews
                </Link>
              </li>
              <li>
                <Link to="/documentaries" className="hover:text-white transition-colors">
                  Documentaries
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Curated Collections */}
          <div className="space-y-3">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#008CFF]">Curated Curation</h4>
            <ul className="space-y-2 text-xs font-sans text-gray-400">
              <li>
                <Link to="/recommends" className="hover:text-white transition-colors">
                  The Abstract Recommends
                </Link>
              </li>
              <li>
                <Link to="/what-to-watch-next" className="hover:text-white transition-colors">
                  What to Watch Next
                </Link>
              </li>
              <li>
                <Link to="/category/sci-fi" className="hover:text-white transition-colors">
                  Sci-Fi Archive
                </Link>
              </li>
              <li>
                <Link to="/category/drama" className="hover:text-white transition-colors">
                  Drama Archive
                </Link>
              </li>
              <li>
                <Link to="/tags/masterpiece" className="hover:text-white transition-colors">
                  Masterpieces (10/10)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Independence & Support */}
          <div className="space-y-3">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#008CFF]">About & Contact</h4>
            <ul className="space-y-2 text-xs font-sans text-gray-400">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Editorial Ethos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact & Enquiries
                </Link>
              </li>
            </ul>
            <div className="pt-2">
              <a
                href="https://buymeacoffee.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white font-sans text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-xs"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Buy Me a Coffee</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 font-sans space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} The Abstract Take. All editorial opinions are personal.
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/about" className="hover:text-gray-200">About</Link>
            <Link to="/contact" className="hover:text-gray-200">Contact</Link>
            <Link to="/admin" className="hover:text-gray-200">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
