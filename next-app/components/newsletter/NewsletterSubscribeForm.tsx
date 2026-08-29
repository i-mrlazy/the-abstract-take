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
    } catch (err: any) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-1.5 text-[11px] font-mono font-bold tracking-widest text-[#008CFF] uppercase">
          <Mail className="w-3.5 h-3.5" />
          <span>The Abstract Dispatch</span>
        </div>
        <h4 className="font-serif font-black text-xl sm:text-2xl text-gray-950 tracking-tight">
          Newsletter
        </h4>
        <p className="font-news text-xs sm:text-sm text-gray-600 max-w-md leading-relaxed">
          Occasional writing, curated recommendations, and unfiltered takes from The Abstract Take.
        </p>
      </div>

      {status === 'success' ? (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2.5 text-emerald-800 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 max-w-md" noValidate>
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
                placeholder="email@example.com"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-[#111111] hover:bg-[#008CFF] text-white rounded-xl text-xs font-mono font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : (
                <>
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
        </form>
      )}
    </div>
  );
}
