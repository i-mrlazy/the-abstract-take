'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

interface AdminSidebarProps {
  pendingCommentsCount?: number;
  draftsCount?: number;
}

const STORAGE_KEY = 'abstract_cms_sidebar_collapsed';

export function AdminSidebar({
  pendingCommentsCount = 0,
  draftsCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore sidebar collapse preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // LocalStorage access may fail in restricted environments
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // LocalStorage write fallback
      }
      return next;
    });
  };

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

  // ---------------------------------------------------------------------------
  // 1. EXPANDED SIDEBAR CONTENT (Desktop Expanded & Mobile Drawer)
  // ---------------------------------------------------------------------------
  const expandedSidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white text-gray-900 border-r border-gray-200/80 overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 shrink-0 bg-[#008CFF] rounded-xl flex items-center justify-center font-serif font-black text-white text-sm shadow-2xs">
              AT
            </div>
            <div className="min-w-0">
              <h2 className="font-serif font-black text-sm text-gray-900 tracking-tight leading-none truncate">
                THE ABSTRACT TAKE
              </h2>
              <span className="text-[10px] font-mono text-[#008CFF] font-bold tracking-wider uppercase">
                CMS Console
              </span>
            </div>
          </div>
          {/* Collapse Button (Desktop) */}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
            aria-expanded={true}
            title="Collapse sidebar (toward left)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {/* Close Button (Mobile) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Summary */}
        <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-8 h-8 shrink-0 rounded-full bg-[#008CFF] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] font-mono text-gray-500 truncate">{user?.email || 'admin'}</p>
          </div>
          <span className="px-1.5 py-0.5 bg-blue-50 text-[#008CFF] border border-blue-100 text-[9px] font-mono rounded uppercase font-bold shrink-0">
            {user?.role || 'Admin'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1" role="navigation" aria-label="CMS Admin Navigation">
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
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#008CFF]' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${
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
          <ExternalLink className="w-3.5 h-3.5 text-[#008CFF] shrink-0" />
          <span>View Live Publication</span>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-mono border border-red-200/70 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // 2. COLLAPSED SIDEBAR CONTENT (Desktop Icon-Only Navigation Rail)
  // ---------------------------------------------------------------------------
  const collapsedSidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white text-gray-900 border-r border-gray-200/80">
      <div>
        {/* Compact Header with Monogram & Expand Toggle */}
        <div className="p-3 border-b border-gray-100 flex flex-col items-center gap-2.5">
          <div className="w-8 h-8 bg-[#008CFF] rounded-xl flex items-center justify-center font-serif font-black text-white text-sm shadow-2xs">
            AT
          </div>
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Expand sidebar"
            aria-expanded={false}
            title="Expand sidebar (toward right)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Compact User Profile Avatar with Hover Tooltip */}
        <div className="py-3 px-2 border-b border-gray-100 flex justify-center relative group">
          <div className="w-8 h-8 rounded-full bg-[#008CFF] text-white flex items-center justify-center text-xs font-bold shadow-2xs cursor-default">
            {user?.name?.[0] || 'A'}
          </div>
          {/* Profile Tooltip */}
          <div
            role="tooltip"
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50"
          >
            <p className="font-bold">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-gray-300 font-mono">{user?.email || 'admin'}</p>
            <span className="inline-block px-1.5 py-0.5 bg-[#008CFF]/30 text-[#008CFF] border border-[#008CFF]/50 text-[9px] font-mono rounded uppercase font-bold mt-1">
              {user?.role || 'Admin'}
            </span>
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 border-y-4 border-y-transparent border-r-4 border-r-gray-900" />
          </div>
        </div>

        {/* Compact Navigation Rail */}
        <nav className="p-2 space-y-1" role="navigation" aria-label="CMS Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <div key={item.href} className="relative group flex justify-center w-full">
                <Link
                  href={item.href}
                  className={`flex items-center justify-center w-10 h-10 rounded-xl text-xs font-medium transition-all relative ${
                    active
                      ? 'bg-blue-50 text-[#008CFF] font-bold border border-blue-100 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#008CFF]' : 'text-gray-400 group-hover:text-gray-700'}`} />
                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full border ${
                        item.badgeColor || 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Floating Hover Tooltip */}
                <div
                  role="tooltip"
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 border-y-4 border-y-transparent border-r-4 border-r-gray-900" />
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Compact Footer Controls */}
      <div className="p-2 border-t border-gray-100 flex flex-col items-center space-y-2">
        <div className="relative group w-full flex justify-center">
          <Link
            href="/"
            target="_blank"
            className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs border border-gray-200/80 transition-colors"
            aria-label="View Live Publication"
          >
            <ExternalLink className="w-4 h-4 text-[#008CFF]" />
          </Link>
          <div
            role="tooltip"
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center"
          >
            <span>View Live Publication</span>
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 border-y-4 border-y-transparent border-r-4 border-r-gray-900" />
          </div>
        </div>

        <div className="relative group w-full flex justify-center">
          <button
            onClick={logout}
            className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs border border-red-200/70 transition-colors cursor-pointer"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <div
            role="tooltip"
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center"
          >
            <span>Sign Out</span>
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 border-y-4 border-y-transparent border-r-4 border-r-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sticky Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 p-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-[#008CFF] rounded-lg flex items-center justify-center font-serif font-black text-white text-xs shadow-2xs">
            AT
          </div>
          <span className="font-serif font-black text-sm text-gray-900">CMS Console</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-50">
            {expandedSidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar with Smooth Width Transition */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-30 transition-[width] duration-200 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {isCollapsed ? collapsedSidebarContent : expandedSidebarContent}
      </aside>
    </>
  );
}
