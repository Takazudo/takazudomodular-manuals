'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ViewMode, ViewModeActions, ViewModeState } from './types';

type ViewModeContextValue = ViewModeState & ViewModeActions;

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('page');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [thumbsModalOpen, setThumbsModalOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const openThumbsModal = useCallback(() => {
    setThumbsModalOpen(true);
  }, []);

  const closeThumbsModal = useCallback(() => {
    setThumbsModalOpen(false);
  }, []);

  const value = useMemo<ViewModeContextValue>(
    () => ({
      viewMode,
      sidebarOpen,
      thumbsModalOpen,
      setViewMode,
      toggleSidebar,
      openThumbsModal,
      closeThumbsModal,
    }),
    [viewMode, sidebarOpen, thumbsModalOpen, toggleSidebar, openThumbsModal, closeThumbsModal],
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode(): ViewModeContextValue {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
