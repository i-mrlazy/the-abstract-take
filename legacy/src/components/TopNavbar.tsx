import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bookmark,
  Sparkles,
  Settings,
  Menu,
  X,
  Film,
  Compass,
  Info,
  Mail,
  Clapperboard,
  ArrowRight,
  ExternalLink,
  Tv,
} from 'lucide-react';

interface TopNavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAiConcierge: () => void;
  bookmarkedCount: number;
  onOpenBookmarks: () => void;
  onOpenAdmin?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAiConcierge,
  bookmarkedCount,
  onOpenBookmarks,
  onOpenAdmin,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/', label: 'My Take', icon: Film },
    { path: '/reviews', label: 'All Reviews', icon: Clapperboard },
    { path: '/movies', label: 'Movies', icon: Film },
    { path: '/series', label: 'Series', icon: Tv },
    { path: '/anime', label: 'Anime', icon: Sparkles },
    { path: '/recommends', label: 'Recommends', icon: Compass },
    { path: '/what-to-watch-next', label: 'What Next', icon: Sparkles },
    { path: '/about', label: 'About', icon: Info },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleAdminClick = () => {
    if (onOpenAdmin) {
      onOpenAdmin();
    } else {
      navigate('/admin');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#111111] text-white border-b border-gray-800 shadow-md">
      {/* Top Utility Micro-Bar */}
      <div className="hidden md:block w-full bg-[#0A0A0A] border-b border-white/5 text-[11px] font-mono text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex items-center justify-between">
          <div className="flex items-center space-x-3 whitespace-nowrap">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#008CFF] animate-pulse" />
              <span className="text-gray-300 font-bold uppercase tracking-widest">CRITICAL FILM & TV ESSAYS</span>
            </div>
            <span className="text-gray-700">|</span>
            <span className="text-gray-400 font-sans italic text-xs">
              Personal takes on what’s truly worth watching.
            </span>
          </div>

          <div className="flex items-center space-x-4 whitespace-nowrap">
            <button
              onClick={handleAdminClick}
              className="flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <Settings className="w-3 h-3 text-[#008CFF]" />
              <span>Editorial Studio</span>
              <span className="text-[9px] bg-white/10 px-1 py-0.2 rounded text-gray-300">Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-3">
          {/* Left: Brand Identity */}
          <Link
            to="/"
            className="flex items-center space-x-2.5 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#008CFF] via-[#00C0FF] to-cyan-300 flex items-center justify-center text-black font-black text-base shadow-sm group-hover:scale-105 transition-transform duration-200">
              A
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-black text-lg tracking-tight text-white group-hover:text-[#00C0FF] transition-colors leading-none">
                The Abstract Take
              </span>
              <span className="text-[9.5px] font-mono uppercase tracking-widest text-gray-400 font-medium leading-tight mt-0.5">
                My Take on What's Worth Watching
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1 font-sans text-xs uppercase tracking-wider font-bold">
            {navLinks.slice(0, 7).map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                    active
                      ? 'bg-[#008CFF] text-white shadow-xs font-bold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center space-x-2 bg-white/5 border border-white/10"
              title="Search takes (Cmd+K)"
            >
              <Search className="w-4 h-4 text-[#00C0FF]" />
              <span className="hidden sm:inline text-xs font-mono text-gray-400">Search</span>
              <kbd className="hidden md:inline text-[9px] font-mono bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </button>

            {/* AI Concierge Trigger */}
            <button
              onClick={onOpenAiConcierge}
              className="bg-gradient-to-r from-[#008CFF] to-cyan-500 hover:from-[#0077dd] hover:to-cyan-600 text-white p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-mono font-bold uppercase flex items-center space-x-1.5 shadow-sm hover:shadow-cyan-500/20 hover:-translate-y-0.5 transition-all cursor-pointer"
              title="Personal AI Recommendation Concierge"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Curator AI</span>
            </button>

            {/* Bookmarks Drawer Trigger */}
            <button
              onClick={onOpenBookmarks}
              className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Saved takes"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarkedCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#008CFF] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center border border-[#111111]">
                  {bookmarkedCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#161616] border-b border-gray-800 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                    active
                      ? 'bg-[#008CFF] text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#00C0FF]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleAdminClick();
              }}
              className="flex items-center space-x-2 text-xs font-mono text-gray-400 hover:text-white py-1"
            >
              <Settings className="w-4 h-4 text-[#008CFF]" />
              <span>Editorial Studio (Admin)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
