import { create } from 'zustand';
import type { Breakpoint } from './useBreakpoint';

export type MobilePanel = 'none' | 'left' | 'right';
export type WorkflowStepId = 1 | 2 | 3 | 4 | 5 | 6;
export type LeftPanelId = 'projects' | 'media' | 'templates' | 'music' | 'subtitles' | 'settings';
export type RightPanelId = 'settings' | 'scenes' | 'inspector' | 'ai';

interface UiState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  mobilePanel: MobilePanel;
  sourcePanelOpen: boolean;
  timelineExpanded: boolean;
  activeWorkflowStep: WorkflowStepId;
  activeLeftPanel: LeftPanelId;
  activeRightPanel: RightPanelId;
  syncLayout: (bp: Breakpoint) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setSourcePanelOpen: (open: boolean) => void;
  setActiveLeftPanel: (panel: LeftPanelId) => void;
  setActiveRightPanel: (panel: RightPanelId) => void;
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
  sourcePanelOpen: false,
  timelineExpanded: true,
  activeWorkflowStep: 1,
  activeLeftPanel: 'projects',
  activeRightPanel: 'settings',

  syncLayout: (bp) => {
    if (bp === 'desktop') {
      set({ leftPanelOpen: true, rightPanelOpen: true, mobilePanel: 'none' });
    } else if (bp === 'tablet') {
      set({ leftPanelOpen: true, rightPanelOpen: false, mobilePanel: 'none' });
    } else {
      set({ leftPanelOpen: false, rightPanelOpen: false, mobilePanel: 'none' });
    }
  },

  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setSourcePanelOpen: (open) => set({ sourcePanelOpen: open }),
  setActiveLeftPanel: (panel) => set({ activeLeftPanel: panel }),
  setActiveRightPanel: (panel) => set({ activeRightPanel: panel }),

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
