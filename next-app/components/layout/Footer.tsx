import React from 'react';
import Link from 'next/link';
import { NewsletterSubscribeForm } from '../newsletter/NewsletterSubscribeForm';
import { CuratorAiTrigger } from '../ai/CuratorAiTrigger';
import { Heart, Settings } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#111111] text-white border-t border-gray-800 pt-14 pb-8 text-left mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="mb-14">
          <NewsletterSubscribeForm />
        </div>

        {/* Brand & Footer Nav Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-gray-800">
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#008CFF] to-[#00C0FF] flex items-center justify-center text-black font-black text-sm group-hover:scale-105 transition-transform">
                AT
              </div>
              <span className="font-serif font-black text-xl text-white group-hover:text-[#00C0FF] transition-colors">
                The Abstract Take
              </span>
            </Link>
            <p className="text-gray-400 text-xs font-news leading-relaxed max-w-sm">
              An independent digital publication offering unfiltered cinema, television, anime, and documentary critiques scored strictly on the calibrated 1–10 Abstract Scale.
            </p>
            <div className="pt-2">
              <CuratorAiTrigger label="What Should I Watch Next?" />
            </div>
          </div>

          {/* Col 2: Review Archives */}
          <div className="space-y-3">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#008CFF]">
              Review Archives
            </h4>
            <ul className="space-y-2 text-xs font-sans text-gray-400">
              <li>
                <Link href="/reviews" className="hover:text-white transition-colors">
                  All Reviews
                </Link>
              </li>
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">
                  Feature Movies
                </Link>
              </li>
              <li>
                <Link href="/series" className="hover:text-white transition-colors">
                  Prestige Series
                </Link>
              </li>
              <li>
                <Link href="/anime" className="hover:text-white transition-colors">
                  Anime Archives
                </Link>
              </li>
              <li>
                <Link href="/documentaries" className="hover:text-white transition-colors">
                  Documentaries
                </Link>
              </li>
              <li>
                <Link href="/mini-series" className="hover:text-white transition-colors">
                  Mini-Series
                </Link>
              </li>
              <li>
                <Link href="/specials" className="hover:text-white transition-colors">
                  Specials & Standalone
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Unified Discovery & Collections */}
          <div className="space-y-3">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#008CFF]">
              Discovery & Watchlists
            </h4>
            <ul className="space-y-2 text-xs font-sans text-gray-400">
              <li>
                <Link href="/what-to-watch-next" className="hover:text-white transition-colors">
                  What Should I Watch Next?
                </Link>
              </li>
              <li>
                <Link href="/recommends" className="hover:text-white transition-colors">
                  Curated Collections
                </Link>
              </li>
              <li>
                <Link href="/reviews?minScore=9" className="hover:text-white transition-colors">
                  Signature Masterpieces (9–10)
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-white transition-colors">
                  Search Archives (⌘K)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Publication Ethos */}
          <div className="space-y-3">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#008CFF]">
              Publication
            </h4>
            <ul className="space-y-2 text-xs font-sans text-gray-400">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Editorial Ethos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact & Enquiries
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors inline-flex items-center space-x-1">
                  <Settings className="w-3 h-3 text-[#008CFF]" />
                  <span>Editorial Studio (Admin)</span>
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
            <Link href="/about" className="hover:text-gray-200 transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-gray-200 transition-colors">
              Contact
            </Link>
            <Link href="/admin" className="hover:text-gray-200 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
