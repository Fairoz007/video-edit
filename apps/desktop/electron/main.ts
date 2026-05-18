import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork, ChildProcess } from 'child_process';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === 'development';
let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

const ROOT = process.env.DOCUFORGE_ROOT
  ? path.resolve(process.env.DOCUFORGE_ROOT)
  : path.join(__dirname, '../../..');
const PROJECTS_DIR = path.join(ROOT, 'projects');
const CACHE_DIR = path.join(ROOT, 'cache');
const EXPORTS_DIR = path.join(ROOT, 'exports');

function ensureDirs() {
  for (const dir of [PROJECTS_DIR, CACHE_DIR, EXPORTS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

const BACKEND_PORT = process.env.BACKEND_PORT || '3847';
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

function startBackend() {
  const serverPath = path.join(ROOT, 'apps', 'api', 'server.js');
  if (!fs.existsSync(serverPath)) return;
  backendProcess = fork(serverPath, [], {
    env: { ...process.env, DOCUFORGE_ROOT: ROOT, BACKEND_PORT },
    stdio: 'inherit',
  });
}

async function waitForBackend(maxAttempts = 40, intervalMs = 250): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) return true;
    } catch {
      // backend still starting
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  console.warn('[DocuForge] Backend did not respond on', BACKEND_URL);
  return false;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(ROOT, 'apps', 'web', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  ensureDirs();
  const alreadyUp = await waitForBackend(4, 200);
  if (!alreadyUp) {
    startBackend();
    await waitForBackend();
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  backendProcess?.kill();
  if (process.platform !== 'darwin') app.quit();
});

// IPC: paths & filesystem
ipcMain.handle('get-paths', () => ({
  root: ROOT,
  projects: PROJECTS_DIR,
  cache: CACHE_DIR,
  exports: EXPORTS_DIR,
}));

ipcMain.handle('select-export-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-path', async (_e, filePath: string) => {
  await shell.openPath(filePath);
});

ipcMain.handle('show-item-in-folder', async (_e, filePath: string) => {
  shell.showItemInFolder(filePath);
});
