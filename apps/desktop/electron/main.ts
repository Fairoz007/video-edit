import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  protocol,
  net,
  Menu,
} from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import { loadAppEnv } from './loadAppEnv.js';
import {
  applyPackagedRuntimeEnv,
  readDocuForgeSetupStatus,
  runDocuForgeSetup,
  shouldPromptDocuForgeSetup,
  skipDocuForgeSetup,
} from './docuforgeSetup.js';
import {
  getDataRoot,
  getInstallRoot,
  getServerScriptPath,
  getWebDistDir,
} from './paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** file:// + Vite `crossorigin` modules fail silently — serve UI over app:// */
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

app.setName('DocuForge');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

let installRoot = '';
let dataRoot = '';
let projectsDir = '';
let cacheDir = '';
let exportsDir = '';

function initRoots() {
  const roots = loadAppEnv();
  installRoot = roots.installRoot;
  dataRoot = roots.dataRoot;
  projectsDir = path.join(dataRoot, 'projects');
  cacheDir = path.join(dataRoot, 'cache');
  exportsDir = path.join(dataRoot, 'exports');
  if (app.isPackaged) {
    applyPackagedRuntimeEnv(dataRoot);
  }
}

function ensureDirs() {
  for (const dir of [projectsDir, cacheDir, exportsDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function registerAppProtocol() {
  const webDist = getWebDistDir(installRoot);
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const filePath = path.join(webDist, relative);
    if (!filePath.startsWith(webDist)) {
      return new Response('Forbidden', { status: 403 });
    }
    if (!fs.existsSync(filePath)) {
      console.error('[DocuForge] Missing UI asset:', filePath);
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).href);
  });
}

const BACKEND_PORT = process.env.BACKEND_PORT || '3847';
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

let backendReady = false;
let backendLastError = '';
let usedBackendUrl = false;

function getBackendLogPath(): string {
  return path.join(dataRoot || getDataRoot(), 'logs', 'backend.log');
}

function appendBackendLog(line: string) {
  try {
    const logPath = getBackendLogPath();
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `${line}\n`);
  } catch {
    /* ignore log write errors */
  }
}

function startBackend(): boolean {
  const root = installRoot || getInstallRoot();
  const serverPath = path.resolve(getServerScriptPath(root));
  if (!fs.existsSync(serverPath)) {
    backendLastError = `Backend not found: ${serverPath}`;
    console.error('[DocuForge]', backendLastError);
    appendBackendLog(backendLastError);
    return false;
  }

  console.log('[DocuForge] Starting backend:', serverPath);
  appendBackendLog(`[${new Date().toISOString()}] Starting ${serverPath}`);

  backendProcess = spawn(process.execPath, [serverPath], {
    cwd: root,
    env: {
      ...process.env,
      DOCUFORGE_ROOT: root,
      DOCUFORGE_DATA: dataRoot || getDataRoot(),
      DOCUFORGE_SERVE_UI: '1',
      BACKEND_PORT,
      ELECTRON_RUN_AS_NODE: '1',
      PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  const logOutput = (chunk: Buffer) => {
    const text = chunk.toString();
    process.stdout.write(text);
    for (const line of text.split(/\r?\n/)) {
      if (line.trim()) appendBackendLog(line);
    }
  };

  backendProcess.stdout?.on('data', logOutput);
  backendProcess.stderr?.on('data', logOutput);

  backendProcess.on('error', (err) => {
    backendLastError = err.message;
    console.error('[DocuForge] Backend process error:', err);
    appendBackendLog(`Process error: ${err.message}`);
  });

  backendProcess.on('exit', (code, signal) => {
    backendReady = false;
    const msg = `Backend exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`;
    console.error('[DocuForge]', msg);
    appendBackendLog(msg);
    if (code !== 0 && code !== null) {
      backendLastError = `Backend crashed (exit ${code}). See ${getBackendLogPath()}`;
    }
  });

  return true;
}

async function waitForBackend(maxAttempts = 90, intervalMs = 500): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) {
        backendReady = true;
        return true;
      }
    } catch {
      // backend still starting
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  console.warn('[DocuForge] Backend did not respond on', BACKEND_URL);
  backendReady = false;
  return false;
}

async function showBackendErrorDialog() {
  const logPath = getBackendLogPath();
  const detail = backendLastError || 'The API server did not start.';
  const opts = {
    type: 'error' as const,
    title: 'DocuForge — Backend not running',
    message: 'DocuForge could not start its backend.',
    detail: `${detail}\n\nLog file:\n${logPath}\n\nThe app will stay open but features need the backend. Port ${BACKEND_PORT} must be free.`,
  };
  if (mainWindow) {
    await dialog.showMessageBox(mainWindow, opts);
  } else {
    await dialog.showMessageBox(opts);
  }
}

function loadProductionUi(preferBackend: boolean) {
  if (!mainWindow || isDev) return;

  const webDist = getWebDistDir(installRoot);
  const indexHtml = path.join(webDist, 'index.html');
  const hasBundledUi = fs.existsSync(indexHtml);

  if (preferBackend && backendReady) {
    console.log('[DocuForge] Loading UI from', BACKEND_URL);
    usedBackendUrl = true;
    mainWindow.loadURL(`${BACKEND_URL}/`);
    return;
  }

  usedBackendUrl = false;
  if (hasBundledUi) {
    console.log('[DocuForge] Loading bundled UI (app://)');
    mainWindow.loadURL('app://local/index.html');
    return;
  }

  console.error('[DocuForge] UI build missing:', indexHtml);
  if (backendReady) {
    usedBackendUrl = true;
    mainWindow.loadURL(`${BACKEND_URL}/`);
  }
}

function createWindow() {
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    title: 'DocuForge',
    show: !isDev,
    backgroundColor: '#0a0a0f',
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[DocuForge] Page load failed:', code, desc, url);
    if (isDev) {
      mainWindow?.show();
      return;
    }
    if (usedBackendUrl && mainWindow) {
      usedBackendUrl = false;
      loadProductionUi(false);
    }
  });

  mainWindow.webContents.on('console-message', (_e, _level, message) => {
    if (message.includes('Error') || message.includes('SyntaxError')) {
      console.error('[DocuForge UI]', message);
    }
  });

  if (isDev) {
    void loadDevUi();
  } else {
    loadProductionUi(false);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function bootstrapBackend() {
  if (isDev) {
    const ok = await waitForBackend(120, 500);
    if (!ok) {
      console.warn(
        '[DocuForge] Dev: API not on port',
        BACKEND_PORT,
        '— run npm run dev from repo root (do not start Electron alone)',
      );
    } else {
      backendReady = true;
    }
    return;
  }

  const alreadyUp = await waitForBackend(4, 200);
  if (!alreadyUp) {
    const started = startBackend();
    if (started) {
      const ok = await waitForBackend(60, 500);
      if (!ok) {
        await showBackendErrorDialog();
        return;
      }
    } else {
      await showBackendErrorDialog();
      return;
    }
  } else {
    backendReady = true;
  }

  if (!mainWindow) return;
  loadProductionUi(true);
}

async function waitForVite(maxAttempts = 40, intervalMs = 250): Promise<boolean> {
  const url = 'http://127.0.0.1:5173/';
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* vite still starting */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function loadDevUi() {
  if (!mainWindow) return;
  const viteOk = await waitForVite();
  if (!viteOk) {
    console.warn('[DocuForge] Vite dev server not ready on :5173 — is web dev running?');
  }
  const showWhenReady = () => mainWindow?.show();
  mainWindow.webContents.once('did-finish-load', showWhenReady);
  setTimeout(showWhenReady, 8000);
  await mainWindow.loadURL('http://127.0.0.1:5173/');
  mainWindow.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  initRoots();
  ensureDirs();

  if (!isDev) {
    registerAppProtocol();
  }

  createWindow();
  if (!isDev) {
    void bootstrapBackend();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      if (!isDev) void bootstrapBackend();
    }
  });
});

app.on('window-all-closed', () => {
  backendProcess?.kill();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-paths', () => ({
  root: installRoot,
  data: dataRoot,
  projects: projectsDir,
  cache: cacheDir,
  exports: exportsDir,
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

ipcMain.handle('get-app-info', () => ({
  isPackaged: app.isPackaged,
  version: app.getVersion(),
  name: app.getName(),
}));

ipcMain.handle('docuforge-setup-status', () =>
  readDocuForgeSetupStatus(installRoot, dataRoot),
);

ipcMain.handle('docuforge-setup-should-prompt', () =>
  shouldPromptDocuForgeSetup(installRoot, dataRoot),
);

ipcMain.handle('docuforge-setup-skip', () => {
  skipDocuForgeSetup(dataRoot);
  return { ok: true };
});

ipcMain.handle('docuforge-run-setup', async (event) => {
  const sender = event.sender;
  return runDocuForgeSetup(installRoot, dataRoot, (line) => {
    if (!sender.isDestroyed()) {
      sender.send('docuforge-setup-log', line);
    }
  });
});

ipcMain.handle('docuforge-setup-refresh-python', () => {
  const status = readDocuForgeSetupStatus(installRoot, dataRoot);
  return { pythonFound: status.pythonFound, pythonPath: status.pythonPath };
});

/** @deprecated — use docuforge-* IPC */
ipcMain.handle('chatterbox-setup-status', () =>
  readDocuForgeSetupStatus(installRoot, dataRoot),
);
ipcMain.handle('chatterbox-setup-should-prompt', () =>
  shouldPromptDocuForgeSetup(installRoot, dataRoot),
);
ipcMain.handle('chatterbox-setup-skip', () => {
  skipDocuForgeSetup(dataRoot);
  return { ok: true };
});
ipcMain.handle('chatterbox-run-setup', async (event) => {
  const sender = event.sender;
  return runDocuForgeSetup(installRoot, dataRoot, (line) => {
    if (!sender.isDestroyed()) {
      sender.send('chatterbox-setup-log', line);
    }
  });
});

ipcMain.handle('open-external-url', async (_e, url: string) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    await shell.openExternal(url);
  }
});
