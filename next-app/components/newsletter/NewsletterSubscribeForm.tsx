'use client';

import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface NewsletterSubscribeFormProps {
  preference?: string;
  className?: string;
}

export function NewsletterSubscribeForm({
  preference = 'footer',
  className = '',
}: NewsletterSubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    // Client-side regex email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, preference }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Welcome to The Abstract Dispatch!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Unable to subscribe right now. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white text-gray-900 border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${className}`}
    >
      <div className="max-w-xl space-y-2 text-left">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#008CFF] text-xs font-mono font-bold px-3 py-1 rounded-md uppercase tracking-wider border border-blue-100">
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

      <div className="w-full lg:w-auto flex-1 max-w-md">
        {status === 'success' ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2.5 text-emerald-800 text-xs font-mono font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2" noValidate>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  disabled={loading}
                  placeholder="Enter your email address..."
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 text-xs font-mono focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-[#008CFF] hover:bg-[#0077dd] text-white rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {status === 'error' && (
              <div className="flex items-center space-x-1.5 text-rose-600 text-xs font-mono pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}
            <p className="font-mono text-[10px] text-gray-500 pt-1 text-left">
              100% Independent. Unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
