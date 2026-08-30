'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface AiConciergeContextType {
  isOpen: boolean;
  openConcierge: () => void;
  closeConcierge: () => void;
  toggleConcierge: () => void;
}

const AiConciergeContext = createContext<AiConciergeContextType | undefined>(undefined);

export function AiConciergeProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openConcierge = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeConcierge = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleConcierge = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      openConcierge,
      closeConcierge,
      toggleConcierge,
    }),
    [isOpen, openConcierge, closeConcierge, toggleConcierge]
  );

  return (
    <AiConciergeContext.Provider value={value}>
      {children}
    </AiConciergeContext.Provider>
  );
}

export function useAiConcierge() {
  const context = useContext(AiConciergeContext);
  if (!context) {
    throw new Error('useAiConcierge must be used within an AiConciergeProvider');
  }
  return context;
}
