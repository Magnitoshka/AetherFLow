import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DownloadManager } from './services/downloadManager.js';
import { inspectUrl } from './services/metadataService.js';
import { getToolStatus, resolveTools } from './services/tools.js';
import { parseYouTubeUrl } from './services/url.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

let mainWindow;
let manager;
let tools; // Кэшируем результат resolveTools один раз при создании окна

function sendQueueUpdate(items) {
  mainWindow?.webContents.send('download:queueUpdate', items);
}

function createWindow() {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'AetherFlow',
    backgroundColor: '#080912',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  tools = resolveTools(app);
  manager = new DownloadManager(sendQueueUpdate, tools);

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.on('did-fail-load', (_event, _code, description) => {
    dialog.showErrorBox('Не удалось открыть приложение', description || 'Попробуйте переустановить приложение.');
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('tools:check', async () => getToolStatus(tools));

ipcMain.handle('download:inspectUrl', async (_event, url) => {
  if (!parseYouTubeUrl(url)) {
    throw new Error('Ссылка не похожа на видео или плейлист YouTube.');
  }
  return inspectUrl(url, tools);
});

ipcMain.handle('download:enqueue', async (_event, request) => manager.enqueue(request));
ipcMain.handle('download:cancel', async (_event, id) => manager.cancel(id));
ipcMain.handle('download:cancelAll', async () => manager.cancelAll());
ipcMain.handle('download:retry', async (_event, id) => manager.retry(id));
