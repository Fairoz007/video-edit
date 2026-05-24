import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

export interface SetupRequirement {
  id: string;
  label: string;
  ready: boolean;
  required: boolean;
  detail?: string;
}

export interface DocuForgeSetupStatus {
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

export interface DocuForgeAPI {
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

const api: DocuForgeAPI = {
  getPaths: () => ipcRenderer.invoke('get-paths'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  selectExportFolder: () => ipcRenderer.invoke('select-export-folder'),
  openPath: (p) => ipcRenderer.invoke('open-path', p),
  showItemInFolder: (p) => ipcRenderer.invoke('show-item-in-folder', p),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  getDocuForgeSetupStatus: () => ipcRenderer.invoke('docuforge-setup-status'),
  shouldPromptDocuForgeSetup: () => ipcRenderer.invoke('docuforge-setup-should-prompt'),
  skipDocuForgeSetup: () => ipcRenderer.invoke('docuforge-setup-skip'),
  runDocuForgeSetup: () => ipcRenderer.invoke('docuforge-run-setup'),
  refreshSetupPython: () => ipcRenderer.invoke('docuforge-setup-refresh-python'),
  onDocuForgeSetupLog: (callback) => {
    const onLog = (_event: IpcRendererEvent, line: string) => callback(line);
    const onLegacy = (_event: IpcRendererEvent, line: string) => callback(line);
    ipcRenderer.on('docuforge-setup-log', onLog);
    ipcRenderer.on('chatterbox-setup-log', onLegacy);
    return () => {
      ipcRenderer.removeListener('docuforge-setup-log', onLog);
      ipcRenderer.removeListener('chatterbox-setup-log', onLegacy);
    };
  },
  platform: process.platform,
};

contextBridge.exposeInMainWorld('docuforge', api);
