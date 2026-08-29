'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Editorial Proposal');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    // Simulate brief network delay
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h3 className="font-serif font-black text-2xl text-emerald-950">
          Message Received
        </h3>
        <p className="font-news text-sm text-emerald-800 max-w-md mx-auto">
          Thank you for reaching out to The Abstract Take. We review incoming messages regularly and will get back to you if relevant.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setMessage('');
          }}
          className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 mb-1.5">
            Your Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 mb-1.5">
          Subject / Inquiry Type
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs cursor-pointer"
        >
          <option value="Editorial Proposal">Editorial Proposal / Review Pitch</option>
          <option value="Business Enquiry">Business / Partnership Enquiry</option>
          <option value="Collaboration">Collaboration / Guest Essay</option>
          <option value="General Feedback">Reader Feedback / Recommendation</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 mb-1.5">
          Message
        </label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts or proposal..."
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 bg-[#008CFF] hover:bg-[#0077dd] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? (
          <span>Sending...</span>
        ) : (
          <>
            <Send className="w-3.5 h-3.5" />
            <span>Send Message</span>
          </>
        )}
      </button>
    </form>
  );
}
