/// <reference types="vite/client" />

interface DocuForgeAPI {
  getPaths: () => Promise<{ root: string; projects: string; cache: string; exports: string }>;
  selectExportFolder: () => Promise<string | null>;
  openPath: (path: string) => Promise<void>;
  showItemInFolder: (path: string) => Promise<void>;
  platform: NodeJS.Platform;
}

interface Window {
  docuforge?: DocuForgeAPI;
}
