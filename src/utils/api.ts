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
export const createProject = (input: DocumentaryInput) =>
  api.post('/projects', { input });

// Pipeline
export const generateScript = (input: DocumentaryInput) =>
  api.post('/pipeline/script', input);
export const extractKeywords = (payload: {
  text?: string;
  topic?: string;
  articleUrl?: string;
  youtubeUrl?: string;
}) => api.post('/pipeline/keywords', payload);
export const buildTimeline = (data: object) => api.post('/pipeline/timeline', data);

export interface SystemVoice {
  id: string;
  name: string;
  locale: string;
  label: string;
}

export const listVoices = () =>
  api.get<{ platform: string; voices: SystemVoice[]; defaultVoice: string | null }>(
    '/pipeline/voices',
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

// Queue
export const getQueue = () => api.get('/queue');
export const addToQueue = (job: object) => api.post('/queue/add', job);

export interface DocumentaryInput {
  topic?: string;
  articleUrl?: string;
  youtubeUrl?: string;
  voice?: string;
  rate?: number;
}

export interface ExportOptions {
  preset?: '1080p' | '4k' | 'youtube' | 'shorts' | 'reels';
  format?: 'mp4' | 'mov';
  musicPath?: string;
  voice?: string;
  rate?: number;
}

export interface ScriptSection {
  id: string;
  title: string;
  narration: string;
  durationEstimate: number;
}

export interface TimelineScene {
  id: string;
  sectionId: string;
  start: number;
  duration: number;
  media?: { localPath?: string; url?: string; type?: string };
  transition?: string;
  effect?: string;
}
