import axios from 'axios';

const BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')) ||
  (typeof window !== 'undefined' ? '' : 'http://127.0.0.1:3847');

export const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' },
});

export const healthCheck = () =>
  axios.get(`${BASE || ''}/health`, { timeout: 5000 });

export const listProjects = () => api.get('/projects');
export const getProject = (id: string) => api.get(`/projects/${id}`);
export const syncProjectToLegacy = (id: string, project: Record<string, unknown>) =>
  api.post('/projects/sync', { id, project });
export const createProject = (input: DocumentaryInput) =>
  api.post('/projects', { input });

export const generateScript = (input: DocumentaryInput) =>
  api.post('/pipeline/script', input);

export const downloadScriptTemplate = () =>
  api.get('/pipeline/script-template', { responseType: 'blob' });
export const extractKeywords = (payload: {
  text?: string;
  topic?: string;
  articleUrl?: string;
  youtubeUrl?: string;
}) => api.post('/pipeline/keywords', payload);
export const buildTimeline = (data: object) => api.post('/pipeline/timeline', data);

export interface DocumentaryTemplateMeta {
  id: string;
  name: string;
  description: string;
  style: string;
}

export const listDocumentaryTemplates = () =>
  api.get<{ templates: DocumentaryTemplateMeta[]; defaultId: string }>(
    '/pipeline/templates',
  );

export interface SystemVoice {
  id: string;
  name: string;
  locale: string;
  label: string;
  previewUrl?: string;
  previewReady?: boolean;
  language?: string;
  engine?: string;
}

export const listVoices = () =>
  api.get<{
    platform: string;
    voices: SystemVoice[];
    defaultVoice: string | null;
    provider?: string;
  }>('/pipeline/voices');

export const previewVoice = (payload: {
  voice?: string;
  rate?: number;
  pitch?: number;
  text?: string;
}) =>
  api.post<{ url: string; voice: string; rate: number; pitch: number; cached?: boolean }>(
    '/pipeline/voice/preview',
    payload,
    { timeout: 600_000 },
  );

export const searchMedia = (query: string, limit = 20) =>
  api.post('/media/search', { query, limit });
export const downloadMedia = (items: unknown[], topic: string) =>
  api.post('/media/download', { items, topic });

export const scrapeUrlFull = (url: string, topic?: string) =>
  api.post('/scrape/full', { url, topic });

export const startRender = (payload: {
  projectId?: string;
  input: DocumentaryInput;
  options?: ExportOptions;
}) => api.post('/render/start', payload);

export const getRenderStatus = (projectId: string) =>
  api.get(`/render/status/${projectId}`);

export const cancelRender = (projectId: string) =>
  api.post<{ projectId: string; cancelled: boolean }>(`/render/cancel/${projectId}`);

export const restartRender = (payload: {
  projectId?: string;
  input: DocumentaryInput;
  options?: ExportOptions;
}) => api.post('/render/restart', payload);

export const getLatestExport = () =>
  api.get<{ filename: string | null; outputPath: string | null; size?: number }>(
    '/exports/latest',
  );

export type VideoStyle = 'documentary' | 'walkthrough';
export type EditMode = 'with-narration' | 'video-only';

export interface DocumentaryInput {
  topic?: string;
  articleUrl?: string;
  youtubeUrl?: string;
  scriptText?: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  videoStyle?: VideoStyle;
  editMode?: EditMode;
  templateId?: string;
}

export interface ExportOptions {
  preset?: '1080p' | '4k' | 'youtube' | 'shorts' | 'reels';
  format?: 'mp4' | 'mov';
  musicPath?: string;
  voice?: string;
  rate?: number;
  pitch?: number;
}

export interface ScriptSection {
  id: string;
  title: string;
  narration: string;
  durationEstimate: number;
  sceneHeading?: string;
  visualDirection?: string;
  brollSuggestions?: string[];
}

export interface TimelineScene {
  id: string;
  sectionId: string;
  start: number;
  duration: number;
  media?: { localPath?: string; url?: string; type?: string };
  transition?: string;
}

export interface TimelineResult {
  scenes: TimelineScene[];
  totalDuration: number;
  introGraphicSec?: number;
  templateId?: string;
  videoOnly?: boolean;
  sections?: ScriptSection[];
}
