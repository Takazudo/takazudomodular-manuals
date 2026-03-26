export type ViewMode = 'page' | 'scroll';

export interface ViewModeState {
  viewMode: ViewMode;
  sidebarOpen: boolean;
  thumbsModalOpen: boolean;
}

export interface ViewModeActions {
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  openThumbsModal: () => void;
  closeThumbsModal: () => void;
}
