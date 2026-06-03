/** Shared types for DocuForge SaaS (Next.js + Convex + workers). */

export const DEFAULT_TEMPLATE_ID = 'template_premium_longform' as const;

export type ProjectStatus =
  | 'draft'
  | 'generating'
  | 'rendering'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type VideoStyle = 'documentary' | 'walkthrough';
export type EditMode = 'with-narration' | 'video-only';

export interface DocumentaryInput {
  topic?: string;
  articleUrl?: string;
  youtubeUrl?: string;
  scriptText?: string;
  videoStyle?: VideoStyle;
  templateId?: string;
  editMode?: EditMode;
  channelName?: string;
}

export interface ExportOptions {
  preset?: string;
  format?: 'mp4' | 'mov';
}

export interface VoiceSettings {
  provider: 'puter';
  voice: string;
  rate: number;
  pitch: number;
  puterProvider?: string;
}

export type AssetKind =
  | 'stock_video'
  | 'upload'
  | 'narration'
  | 'subtitle'
  | 'music'
  | 'export'
  | 'preview';

export interface CloudAssetRecord {
  _id: string;
  projectId: string;
  kind: AssetKind;
  r2Key: string;
  cdnUrl: string;
  mime: string;
  sizeBytes?: number;
  durationSec?: number;
  meta?: unknown;
}

export interface PresignedUploadIntent {
  uploadUrl: string;
  r2Key: string;
  cdnUrl: string;
  expiresIn: number;
  method: 'PUT';
  headers: { 'Content-Type': string };
}

export interface R2ObjectRef {
  r2Key: string;
  cdnUrl: string;
  mime: string;
  sizeBytes?: number;
  durationSec?: number;
}

/** Legacy filesystem `projects/<id>/project.json` shape (Express era). */
export interface LegacyProjectJson {
  id?: string;
  input?: DocumentaryInput;
  status?: string;
  createdAt?: string | number;
  script?: unknown;
  keywords?: unknown;
  media?: unknown[];
  timeline?: unknown;
  progress?: number;
  stage?: string;
  message?: string;
  outputPath?: string;
  error?: string;
  voiceSettings?: unknown;
  exportOptions?: unknown;
}
