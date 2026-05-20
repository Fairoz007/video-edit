import { create } from 'zustand';
import type { Breakpoint } from './useBreakpoint';

export type MobilePanel = 'none' | 'left' | 'right';
export type WorkflowStepId = 1 | 2 | 3 | 4 | 5 | 6;

interface UiState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  mobilePanel: MobilePanel;
  sourcePanelOpen: boolean;
  timelineExpanded: boolean;
  activeWorkflowStep: WorkflowStepId;
  syncLayout: (bp: Breakpoint) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleSourcePanel: () => void;
  toggleTimeline: () => void;
  setMobilePanel: (panel: MobilePanel) => void;
  setActiveWorkflowStep: (step: WorkflowStepId) => void;
  closeMobilePanels: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  mobilePanel: 'none',
  sourcePanelOpen: true,
  timelineExpanded: true,
  activeWorkflowStep: 1,

  syncLayout: (bp) => {
    if (bp === 'desktop') {
      set({ leftPanelOpen: true, rightPanelOpen: true, mobilePanel: 'none' });
    } else if (bp === 'tablet') {
      set({ leftPanelOpen: true, rightPanelOpen: false, mobilePanel: 'none' });
    } else {
      set({ leftPanelOpen: false, rightPanelOpen: false, mobilePanel: 'none' });
    }
  },

  setLeftPanelOpen: (open) => set({ leftPanelOpen: open, mobilePanel: open ? 'left' : 'none' }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open, mobilePanel: open ? 'right' : 'none' }),

  toggleLeftPanel: () => {
    const { mobilePanel, leftPanelOpen } = get();
    if (mobilePanel !== 'none') {
      set({ mobilePanel: mobilePanel === 'left' ? 'none' : 'left', leftPanelOpen: mobilePanel !== 'left' });
    } else {
      set({ leftPanelOpen: !leftPanelOpen });
    }
  },

  toggleRightPanel: () => {
    const { mobilePanel, rightPanelOpen } = get();
    if (mobilePanel !== 'none') {
      set({ mobilePanel: mobilePanel === 'right' ? 'none' : 'right', rightPanelOpen: mobilePanel !== 'right' });
    } else {
      set({ rightPanelOpen: !rightPanelOpen });
    }
  },

  toggleSourcePanel: () => set((s) => ({ sourcePanelOpen: !s.sourcePanelOpen })),
  toggleTimeline: () => set((s) => ({ timelineExpanded: !s.timelineExpanded })),
  setActiveWorkflowStep: (step) => set({ activeWorkflowStep: step }),

  setMobilePanel: (panel) =>
    set({
      mobilePanel: panel,
      leftPanelOpen: panel === 'left',
      rightPanelOpen: panel === 'right',
    }),

  closeMobilePanels: () => set({ mobilePanel: 'none', leftPanelOpen: false, rightPanelOpen: false }),
}));
