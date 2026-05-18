import { contextBridge, ipcRenderer } from 'electron';

export interface DocuForgeAPI {
  getPaths: () => Promise<{ root: string; projects: string; cache: string; exports: string }>;
  selectExportFolder: () => Promise<string | null>;
  openPath: (path: string) => Promise<void>;
  showItemInFolder: (path: string) => Promise<void>;
  platform: NodeJS.Platform;
}

const api: DocuForgeAPI = {
  getPaths: () => ipcRenderer.invoke('get-paths'),
  selectExportFolder: () => ipcRenderer.invoke('select-export-folder'),
  openPath: (p) => ipcRenderer.invoke('open-path', p),
  showItemInFolder: (p) => ipcRenderer.invoke('show-item-in-folder', p),
  platform: process.platform,
};

contextBridge.exposeInMainWorld('docuforge', api);
