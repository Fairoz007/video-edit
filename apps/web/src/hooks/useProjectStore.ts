import { create } from 'zustand';
import type { DocumentaryInput, ExportOptions, TimelineResult } from '../utils/api';

export interface ProjectState {
  projectId: string | null;
  input: DocumentaryInput;
  script: { topic: string; sections: ScriptSection[]; fullNarration: string } | null;
  keywords: { keywords: string[] } | null;
  media: unknown[];
  timeline: TimelineResult | null;
  status: 'idle' | 'generating' | 'rendering' | 'completed' | 'failed';
  progress: number;
  stage: string;
  message: string;
  outputPath: string | null;
  exportOptions: ExportOptions;
  voiceSettings: { voice: string; rate: number; pitch: number };
  errorMessage: string | null;

  setInput: (input: Partial<DocumentaryInput>) => void;
  setError: (message: string | null) => void;
  setProjectId: (id: string | null) => void;
  setScript: (script: ProjectState['script']) => void;
  setKeywords: (kw: ProjectState['keywords']) => void;
  setMedia: (media: unknown[]) => void;
  setTimeline: (tl: ProjectState['timeline']) => void;
  setProgress: (progress: number, stage: string, message: string) => void;
  setStatus: (status: ProjectState['status']) => void;
  setOutputPath: (path: string | null) => void;
  setExportOptions: (opts: Partial<ExportOptions>) => void;
  setVoiceSettings: (opts: Partial<{ voice: string; rate: number; pitch: number }>) => void;
  reset: () => void;
}

const defaultInput: DocumentaryInput = {
  topic: '',
  videoStyle: 'documentary',
  templateId: 'template_cinematic_docuforge',
};

export const useProjectStore = create<ProjectState>((set) => ({
  projectId: null,
  input: defaultInput,
  script: null,
  keywords: null,
  media: [],
  timeline: null,
  status: 'idle',
  progress: 0,
  stage: '',
  message: '',
  outputPath: null,
  exportOptions: { preset: '1080p', format: 'mp4' },
  voiceSettings: { voice: '', rate: 175, pitch: 0 },
  errorMessage: null,

  setInput: (input) => set((s) => ({ input: { ...s.input, ...input } })),
  setError: (errorMessage) => set({ errorMessage }),
  setProjectId: (id) => set({ projectId: id }),
  setScript: (script) => set({ script }),
  setKeywords: (keywords) => set({ keywords }),
  setMedia: (media) => set({ media }),
  setTimeline: (timeline) => set({ timeline }),
  setProgress: (progress, stage, message) => set({ progress, stage, message }),
  setStatus: (status) => set({ status }),
  setOutputPath: (outputPath) => set({ outputPath }),
  setExportOptions: (opts) =>
    set((s) => ({ exportOptions: { ...s.exportOptions, ...opts } })),
  setVoiceSettings: (opts) =>
    set((s) => ({ voiceSettings: { ...s.voiceSettings, ...opts } })),
  reset: () =>
    set({
      projectId: null,
      input: defaultInput,
      script: null,
      keywords: null,
      media: [],
      timeline: null,
      status: 'idle',
      progress: 0,
      stage: '',
      message: '',
      outputPath: null,
      errorMessage: null,
    }),
}));
