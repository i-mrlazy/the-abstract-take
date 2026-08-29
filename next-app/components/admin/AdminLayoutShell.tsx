'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { Loader2 } from 'lucide-react';

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [draftsCount, setDraftsCount] = useState(0);
  const [pendingCommentsCount, setPendingCommentsCount] = useState(0);

  useEffect(() => {
    if (user && pathname !== '/admin/login') {
      fetch('/api/reviews?status=all')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.reviews) {
            const drafts = data.reviews.filter((r: any) => r.status === 'draft').length;
            setDraftsCount(drafts);
          }
        })
        .catch(() => {});

      fetch('/api/comments')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.comments) {
            const pending = data.comments.filter((c: any) => c.status === 'pending').length;
            setPendingCommentsCount(pending);
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  // Login page gets a clean centered standalone shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center text-gray-900 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#008CFF]" />
        <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
          Loading Editorial Desk...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col md:flex-row text-left selection:bg-[#008CFF] selection:text-white">
      <AdminSidebar
        pendingCommentsCount={pendingCommentsCount}
        draftsCount={draftsCount}
      />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
