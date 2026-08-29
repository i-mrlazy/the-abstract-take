import React from 'react';
import { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';

export const metadata: Metadata = {
  title: 'Editorial CMS Console — The Abstract Take',
  description: 'Administrative publishing desk and editorial content management system.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AuthProvider>
  );
}
