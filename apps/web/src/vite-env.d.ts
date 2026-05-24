/// <reference types="vite/client" />

interface SetupRequirement {
  id: string;
  label: string;
  ready: boolean;
  required: boolean;
  detail?: string;
}

interface DocuForgeSetupStatus {
  isPackaged: boolean;
  pythonFound: boolean;
  pythonPath: string | null;
  pipReady: boolean;
  modelsReady: boolean;
  playwrightReady: boolean;
  ffmpegReady: boolean;
  setupComplete: boolean;
  skipped: boolean;
  setupScriptExists: boolean;
  requirements: SetupRequirement[];
  stamp: {
    pip?: boolean;
    chatterboxModels?: string[];
    playwright?: boolean;
    ffmpeg?: boolean;
    complete?: boolean;
    device?: string;
    python?: string;
  } | null;
}

interface DocuForgeAPI {
  getPaths: () => Promise<{ root: string; projects: string; cache: string; exports: string }>;
  getAppInfo: () => Promise<{ isPackaged: boolean; version: string; name: string }>;
  selectExportFolder: () => Promise<string | null>;
  openPath: (path: string) => Promise<void>;
  showItemInFolder: (path: string) => Promise<void>;
  openExternalUrl: (url: string) => Promise<void>;
  getDocuForgeSetupStatus: () => Promise<DocuForgeSetupStatus>;
  shouldPromptDocuForgeSetup: () => Promise<boolean>;
  skipDocuForgeSetup: () => Promise<{ ok: boolean }>;
  runDocuForgeSetup: () => Promise<{ ok: boolean; error?: string; status?: DocuForgeSetupStatus }>;
  refreshSetupPython: () => Promise<{ pythonFound: boolean; pythonPath: string | null }>;
  onDocuForgeSetupLog: (callback: (line: string) => void) => () => void;
  platform: NodeJS.Platform;
}

interface Window {
  docuforge?: DocuForgeAPI;
}
