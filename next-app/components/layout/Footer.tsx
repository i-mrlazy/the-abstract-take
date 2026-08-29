import React from 'react';
import Link from 'next/link';
import { NewsletterSubscribeForm } from '../newsletter/NewsletterSubscribeForm';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200/90 py-12 md:py-16 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Newsletter Section */}
        <div className="bg-gray-50/80 border border-gray-200/80 rounded-3xl p-6 sm:p-8">
          <NewsletterSubscribeForm />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-gray-100">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#008CFF] text-white rounded-lg flex items-center justify-center font-serif font-bold text-sm">
                AT
              </div>
              <span className="font-serif font-black text-lg text-gray-900">THE ABSTRACT TAKE</span>
            </div>
            <p className="font-news text-sm text-gray-600 max-w-md leading-relaxed">
              An independent, opinionated entertainment publication. Uncompromising long-form critique, curated watchlists, and the signature Abstract Score across Cinema, Television, and Anime.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">
              Editorial Formats
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-gray-600">
              <li>
                <Link href="/movies" className="hover:text-[#008CFF] transition-colors">
                  Film Reviews
                </Link>
              </li>
              <li>
                <Link href="/series" className="hover:text-[#008CFF] transition-colors">
                  Series & Television
                </Link>
              </li>
              <li>
                <Link href="/anime" className="hover:text-[#008CFF] transition-colors">
                  Anime Critiques
                </Link>
              </li>
              <li>
                <Link href="/recommends" className="hover:text-[#008CFF] transition-colors">
                  The Abstract Recommends
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">
              Publication
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-gray-600">
              <li>
                <Link href="/about" className="hover:text-[#008CFF] transition-colors">
                  About & The Abstract Scale
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#008CFF] transition-colors">
                  Contact & Feedback
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-gray-500">
          <p>© {new Date().getFullYear()} The Abstract Take. Independent Personal Publication.</p>
          <p className="mt-2 sm:mt-0">Creator rating is authoritative.</p>
        </div>
      </div>
    </footer>
  );
}
