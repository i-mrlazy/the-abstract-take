import React from 'react';
import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, MessageSquare, Briefcase, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact & Enquiries — The Abstract Take',
  description: 'Direct editorial proposals, business inquiries, and reader correspondence for The Abstract Take.',
  alternates: {
    canonical: 'https://theabstracttake.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
      {/* Header */}
      <header className="text-center space-y-4 max-w-xl mx-auto">
        <span className="inline-block px-3 py-1 bg-[#008CFF]/10 text-[#008CFF] rounded-full text-xs font-mono font-bold uppercase tracking-wider">
          Direct Line
        </span>
        <h1 className="font-serif font-black text-4xl sm:text-5xl text-gray-950 tracking-tight">
          Get in Touch
        </h1>
        <p className="font-news text-base sm:text-lg text-gray-600 leading-relaxed">
          Open for editorial discussions, business enquiries, collaborations, and authentic film correspondence.
        </p>
      </header>

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-2">
          <Briefcase className="w-5 h-5 text-[#008CFF]" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-950">
            Business & Collaborations
          </h3>
          <p className="font-news text-xs text-gray-600 leading-relaxed">
            Partnership inquiries and joint cinema essays with creators and curators.
          </p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-2">
          <Sparkles className="w-5 h-5 text-[#008CFF]" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-950">
            Editorial Proposals
          </h3>
          <p className="font-news text-xs text-gray-600 leading-relaxed">
            Suggestions for overlooked cinema gems or retrospectives to critique.
          </p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-2">
          <MessageSquare className="w-5 h-5 text-[#008CFF]" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-950">
            Reader Feedback
          </h3>
          <p className="font-news text-xs text-gray-600 leading-relaxed">
            Thoughtful disagreements, personal verdicts, or reactions to our takes.
          </p>
        </div>
      </div>

      {/* Interactive Form Island */}
      <ContactForm />
    </div>
  );
}
