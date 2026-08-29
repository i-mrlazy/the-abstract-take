import React from 'react';
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
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type AdminTab =
  | 'dashboard'
  | 'reviews'
  | 'new-review'
  | 'recommendations'
  | 'what-next'
  | 'comments'
  | 'newsletter'
  | 'tags'
  | 'media'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingCommentsCount: number;
  draftsCount: number;
  onViewLiveSite: () => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  pendingCommentsCount,
  draftsCount,
  onViewLiveSite,
}: AdminSidebarProps) {
  const { user, logout } = useAuth();

  const navItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reviews', label: 'All Reviews', icon: FileText, badge: draftsCount > 0 ? draftsCount : undefined, badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'new-review', label: 'Write Review', icon: PlusCircle },
    { id: 'recommendations', label: 'Curated Lists', icon: ListOrdered },
    { id: 'what-next', label: 'What To Watch Next', icon: Sparkles },
    { id: 'comments', label: 'Comments Queue', icon: MessageSquare, badge: pendingCommentsCount > 0 ? pendingCommentsCount : undefined, badgeColor: 'bg-blue-100 text-[#008CFF] border-blue-200' },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'tags', label: 'Tags & Genres', icon: Tags },
    { id: 'media', label: 'Media Assets', icon: ImageIcon },
    { id: 'settings', label: 'SEO & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white text-gray-900 border-r border-gray-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-2xs">
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
        </div>

        {/* User Card */}
        <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#008CFF] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] font-mono text-gray-500 truncate">{user?.email}</p>
          </div>
          <span className="px-1.5 py-0.5 bg-blue-50 text-[#008CFF] border border-blue-100 text-[9px] font-mono rounded uppercase font-bold">
            {user?.role || 'Admin'}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-[#008CFF] font-bold border border-blue-100 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#008CFF]' : 'text-gray-400'}`} />
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
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        <button
          onClick={onViewLiveSite}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-mono border border-gray-200/80 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#008CFF]" />
          <span>View Live Publication</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-mono border border-red-200/70 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
