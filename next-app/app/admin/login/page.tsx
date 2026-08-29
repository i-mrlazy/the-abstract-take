'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextDestination = searchParams.get('next') || '/admin';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login(email.trim(), password, keepSignedIn);
      if (res.success) {
        // Redirect to intended destination or dashboard
        router.push(nextDestination.startsWith('/admin') ? nextDestination : '/admin');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col justify-between selection:bg-[#008CFF] selection:text-white">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200/80 px-6 py-4 flex items-center justify-between shadow-2xs">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-mono text-gray-600 hover:text-[#008CFF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO THE ABSTRACT TAKE</span>
        </Link>

        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#008CFF] animate-pulse"></div>
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
            Editorial CMS Console
          </span>
        </div>
      </header>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#008CFF] text-white rounded-2xl shadow-xs mb-4">
              <span className="font-serif font-black text-2xl">AT</span>
            </div>
            <h1 className="font-serif font-black text-2xl lg:text-3xl tracking-tight text-gray-900">
              THE ABSTRACT TAKE
            </h1>
            <p className="font-mono text-xs text-[#008CFF] font-bold uppercase tracking-wider mt-1">
              Editorial CMS & Content Desk
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 md:p-8 shadow-sm relative">
            <div className="flex items-center space-x-2 pb-4 mb-6 border-b border-gray-100">
              <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-sans font-bold text-sm text-gray-900">
                Administrator Authentication
              </span>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Authentication Alert</p>
                  <p className="mt-0.5 text-red-600">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-mono uppercase tracking-wider text-gray-600 mb-1.5"
                >
                  Email Address / Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="editor@theabstracttake.com"
                    autoComplete="username email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-mono uppercase tracking-wider text-gray-600"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep Me Signed In Checkbox */}
              <div className="pt-1">
                <label
                  htmlFor="keep-signed-in"
                  className="inline-flex items-center space-x-2.5 select-none cursor-pointer group"
                >
                  <input
                    id="keep-signed-in"
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#008CFF] focus:ring-[#008CFF] focus:ring-offset-0 focus:ring-2 cursor-pointer transition-colors accent-[#008CFF]"
                  />
                  <span className="text-xs font-sans font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    Keep me signed in (30 days)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-sm uppercase tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Publishing Desk</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 bg-white px-6 py-4 text-center text-xs font-mono text-gray-500">
        The Abstract Take © {new Date().getFullYear()} — Secure Editorial Content Management System
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#008CFF] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
