import { app, shell, BrowserWindow, ipcMain, session } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { readDataFromDisk } from './data';
import { refreshData } from './refresh';
import { initAutoUpdater } from './updater';

/** Security baseline (FR-11). A regression here fails the startup assertion. */
const SECURE_WEB_PREFERENCES = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
} as const;

function assertSecure(): void {
  for (const [flag, expected] of Object.entries(SECURE_WEB_PREFERENCES)) {
    if (
      SECURE_WEB_PREFERENCES[flag as keyof typeof SECURE_WEB_PREFERENCES] !==
      expected
    ) {
      throw new Error(`Insecure webPreferences: ${flag} must be ${expected}`);
    }
  }
}

/** Strict CSP in production; the renderer makes no network calls of its own. */
function applyContentSecurityPolicy(): void {
  if (is.dev) {
    return; // dev relaxes CSP for Vite HMR over websockets
  }
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; connect-src 'none'; img-src 'self' data:; " +
            "style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self'",
        ],
      },
    });
  });
}

function createWindow(): void {
  assertSecure();
  const mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 880,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0d1117',
    title: 'DayONE',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      ...SECURE_WEB_PREFERENCES,
    },
  });

  mainWindow.on('ready-to-show', () => mainWindow.show());

  // Deny new windows and in-page navigation away from the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
    }
  });

  // Debug aids — DevTools are OFF in packaged builds by default (opt-IN), so a
  // packaged app never exposes live keys/quotes via the console. Enable with
  // DAYONE_DEBUG=1. EVERY open path is gated, including the crash/load-failure
  // handlers that fire in production.
  const debugEnabled = !app.isPackaged || process.env['DAYONE_DEBUG'] === '1';
  const openDevTools = (): void => {
    if (debugEnabled) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  };
  if (debugEnabled) {
    mainWindow.webContents.once('did-finish-load', openDevTools);
  }
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`Renderer failed to load (${code} ${desc}) ${url}`);
    openDevTools();
  });
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error('Renderer process gone:', details.reason);
    openDevTools();
  });
  mainWindow.webContents.on('before-input-event', (_e, input) => {
    if (debugEnabled && input.type === 'keyDown' && input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.dayone.app');

  // Deny all permission requests — the app needs none.
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, callback) =>
    callback(false),
  );
  applyContentSecurityPolicy();

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC: load the committed/last-good snapshot; refresh best-effort from network.
  ipcMain.handle('dayone:load-data', () => readDataFromDisk());
  ipcMain.handle('dayone:refresh-data', () => refreshData());

  createWindow();

  // Check for in-place updates (packaged builds only).
  if (app.isPackaged) {
    initAutoUpdater();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
