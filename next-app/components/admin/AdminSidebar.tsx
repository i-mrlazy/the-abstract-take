'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  ListOrdered,
  Sparkles,
  MessageSquare,
  Mail,
  Tags,
  Image as ImageIcon,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

interface AdminSidebarProps {
  pendingCommentsCount?: number;
  draftsCount?: number;
}

export function AdminSidebar({
  pendingCommentsCount = 0,
  draftsCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    {
      href: '/admin/reviews',
      label: 'All Reviews',
      icon: FileText,
      badge: draftsCount > 0 ? draftsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    { href: '/admin/reviews/new', label: 'Write Review', icon: PlusCircle },
    { href: '/admin/recommendations', label: 'Curated Lists', icon: ListOrdered },
    { href: '/admin/what-to-watch', label: 'What To Watch Next', icon: Sparkles },
    {
      href: '/admin/comments',
      label: 'Comments Queue',
      icon: MessageSquare,
      badge: pendingCommentsCount > 0 ? pendingCommentsCount : undefined,
      badgeColor: 'bg-blue-100 text-[#008CFF] border-blue-200',
    },
    { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
    { href: '/admin/tags', label: 'Tags & Genres', icon: Tags },
    { href: '/admin/media', label: 'Media Assets', icon: ImageIcon },
    { href: '/admin/settings', label: 'SEO & Settings', icon: Settings },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white text-gray-900 border-r border-gray-200/80">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#008CFF] rounded-xl flex items-center justify-center font-serif font-black text-white text-sm shadow-2xs">
              AT
            </div>
            <div>
              <h2 className="font-serif font-black text-sm text-gray-900 tracking-tight leading-none">
                THE ABSTRACT TAKE
              </h2>
              <span className="text-[10px] font-mono text-[#008CFF] font-bold tracking-wider uppercase">
                CMS Console
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Summary */}
        <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#008CFF] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] font-mono text-gray-500 truncate">{user?.email || 'admin'}</p>
          </div>
          <span className="px-1.5 py-0.5 bg-blue-50 text-[#008CFF] border border-blue-100 text-[9px] font-mono rounded uppercase font-bold">
            {user?.role || 'Admin'}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-[#008CFF] font-bold border border-blue-100 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#008CFF]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${
                      item.badgeColor || 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-mono border border-gray-200/80 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#008CFF]" />
          <span>View Live Publication</span>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-mono border border-red-200/70 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sticky Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 p-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-[#008CFF] rounded-lg flex items-center justify-center font-serif font-black text-white text-xs">
            AT
          </div>
          <span className="font-serif font-black text-sm text-gray-900">CMS Console</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-gray-50 text-gray-700 border border-gray-200"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-50">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
