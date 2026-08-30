'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAiConcierge } from '@/lib/context/AiConciergeContext';

interface CuratorAiTriggerProps {
  label?: string;
  variant?: 'navbar' | 'footer' | 'banner' | 'pill';
  className?: string;
}

export function CuratorAiTrigger({
  label = 'What Should I Watch Next?',
  variant = 'footer',
  className = '',
}: CuratorAiTriggerProps) {
  const { openConcierge } = useAiConcierge();

  if (variant === 'navbar') {
    return (
      <button
        onClick={openConcierge}
        className={`bg-gradient-to-r from-[#008CFF] to-cyan-500 hover:from-[#0077dd] hover:to-cyan-600 text-white p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-mono font-bold uppercase flex items-center space-x-1.5 shadow-sm hover:shadow-cyan-500/20 hover:-translate-y-0.5 transition-all cursor-pointer ${className}`}
        title="Personal AI Recommendation Concierge"
        aria-label="Open AI Concierge"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Curator AI</span>
      </button>
    );
  }

  if (variant === 'banner') {
    return (
      <button
        onClick={openConcierge}
        className={`bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-xs flex items-center space-x-2 transition-all cursor-pointer hover:-translate-y-0.5 ${className}`}
      >
        <Sparkles className="w-4 h-4 text-white" />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={openConcierge}
        className={`inline-flex items-center space-x-2 bg-[#008CFF]/10 hover:bg-[#008CFF]/20 text-[#008CFF] border border-[#008CFF]/30 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#008CFF]" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={openConcierge}
      className={`inline-flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${className}`}
      title="Personal AI Recommendation Concierge"
    >
      <Sparkles className="w-3.5 h-3.5 text-[#00C0FF]" />
      <span>{label}</span>
    </button>
  );
}
