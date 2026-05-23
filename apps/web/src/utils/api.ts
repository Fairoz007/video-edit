import axios from 'axios';

/** In Vite dev, use same-origin `/api` (proxied to backend). Electron/production use explicit URL. */
const BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'http://127.0.0.1:3847');

export const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' },
});

export const healthCheck = () =>
  axios.get(`${BASE || ''}/health`, { timeout: 5000 });

// Projects
export const listProjects = () => api.get('/projects');
export const getProject = (id: string) => api.get(`/projects/${id}`);
export const cleanWorkspace = () =>
  api.delete<{ ok: boolean; removed: Record<string, number> }>('/projects/workspace');
export const createProject = (input: DocumentaryInput) =>
  api.post('/projects', { input });

// Pipeline
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

export interface TtsHealth {
  ok?: boolean;
  device?: string;
  cuda?: boolean;
  error?: string;
}

export const listVoices = () =>
  api.get<{
    platform: string;
    voices: SystemVoice[];
    defaultVoice: string | null;
    provider?: string;
    tts?: TtsHealth;
    paralinguisticTags?: string[];
    previewCache?: { warming: boolean; complete: boolean; ready: number; total: number };
  }>('/pipeline/voices');

export const getVoicePreviewStatus = () =>
  api.get<{
    warming: boolean;
    complete: boolean;
    ready: number;
    total: number;
    missing: string[];
  }>('/pipeline/voice/previews/status');

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

// Media
export const searchMedia = (query: string, limit = 20) =>
  api.post('/media/search', { query, limit });
export const downloadMedia = (items: unknown[], topic: string) =>
  api.post('/media/download', { items, topic });

// Playwright scrape — view pages, download images/videos for editing
export const scrapePageContent = (url: string) =>
  api.post('/scrape/content', { url });
export const previewScrapedMedia = (url: string, maxItems = 24) =>
  api.post('/scrape/media/preview', { url, maxItems });
export const downloadScrapedMedia = (url: string, topic?: string, maxDownloads = 16) =>
  api.post('/scrape/media/download', { url, topic, maxDownloads });
export const scrapeUrlFull = (url: string, topic?: string) =>
  api.post('/scrape/full', { url, topic });
export const fetchYouTubeMeta = (url: string) => api.post('/scrape/youtube', { url });

// Render
export const startRender = (payload: {
  projectId?: string;
  input: DocumentaryInput;
  options?: ExportOptions;
}) => api.post('/render/start', payload);

export const getRenderStatus = (projectId: string) =>
  api.get(`/render/status/${projectId}`);

export const getLatestExport = () =>
  api.get<{ filename: string | null; outputPath: string | null; size?: number }>(
    '/exports/latest',
  );

// Queue
export const getQueue = () => api.get('/queue');
export const addToQueue = (job: object) => api.post('/queue/add', job);

export type VideoStyle = 'documentary' | 'walkthrough';

/** `with-narration` = full documentary pipeline; `video-only` = edit clips without TTS. */
export type EditMode = 'with-narration' | 'video-only';

export interface DocumentaryInput {
  topic?: string;
  articleUrl?: string;
  youtubeUrl?: string;
  /** Full .txt script content (cinematic template format); skips LLM generation. */
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
  audioDesign?: string;
  transitionNotes?: string;
}

export interface TimelineScene {
  id: string;
  sectionId: string;
  start: number;
  duration: number;
  trimStart?: number;
  trimEnd?: number;
  playbackRate?: number;
  loop?: boolean;
  audioVolume?: number;
  media?: { localPath?: string; url?: string; type?: string };
  transition?: string;
  effect?: string;
}
