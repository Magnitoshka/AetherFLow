# YouTube Downloader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows installable desktop app for downloading YouTube videos and playlists by URL with preview, quality selection, audio mode, queue progress, and speed tracking.

**Architecture:** Use Electron for the Windows desktop shell, React/Vite for the renderer, and a Node main-process service layer that owns metadata lookup, queue state, and child-process downloads. The renderer communicates only through a typed preload API, keeping downloader execution out of the UI.

**Tech Stack:** Electron, React, Vite, electron-builder, Node child_process, yt-dlp executable, ffmpeg executable, CSS modules/plain CSS, Vitest for pure helpers.

---

## File Structure

- `package.json`: project scripts, dependencies, installer metadata.
- `index.html`: renderer entry point.
- `src/main/main.js`: Electron window, IPC handlers, app lifecycle.
- `src/main/preload.js`: safe renderer API exposed with `contextBridge`.
- `src/main/services/url.js`: YouTube URL detection.
- `src/main/services/formatMapper.js`: quality and format selection helpers.
- `src/main/services/progressParser.js`: parse downloader progress lines into UI events.
- `src/main/services/metadataService.js`: run metadata lookup and normalize video/playlist preview data.
- `src/main/services/downloadManager.js`: queue, start/cancel/retry, child process lifecycle.
- `src/renderer/App.jsx`: app composition and screen state.
- `src/renderer/components/*.jsx`: focused UI components.
- `src/renderer/styles.css`: visual system and responsive layout.
- `tests/*.test.js`: unit tests for URL validation, format mapping, and progress parsing.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main/main.js`
- Create: `src/main/preload.js`
- Create: `src/renderer/main.jsx`
- Create: `src/renderer/App.jsx`
- Create: `src/renderer/styles.css`

- [ ] **Step 1: Create package scripts and dependencies**

```json
{
  "name": "youtube-downloader-desktop",
  "version": "0.1.0",
  "private": true,
  "main": "src/main/main.js",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "electron": "electron .",
    "build": "vite build",
    "test": "vitest run",
    "dist": "npm run build && electron-builder --win nsis"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "electron-is-dev": "^3.0.1",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "electron": "^33.2.1",
    "electron-builder": "^25.1.8",
    "vite": "^6.0.3",
    "vitest": "^2.1.8"
  },
  "build": {
    "appId": "com.local.youtubedownloader",
    "productName": "YouTube Downloader",
    "files": ["dist/**/*", "src/main/**/*", "package.json"],
    "win": { "target": "nsis" },
    "nsis": { "oneClick": false, "perMachine": false, "allowToChangeInstallationDirectory": true }
  }
}
```

- [ ] **Step 2: Create minimal Electron window**

```js
// src/main/main.js
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    title: 'YouTube Downloader',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});
```

- [ ] **Step 3: Expose preload API**

```js
// src/main/preload.js
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('downloader', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  inspectUrl: (url) => ipcRenderer.invoke('download:inspectUrl', url),
  enqueue: (request) => ipcRenderer.invoke('download:enqueue', request),
  cancel: (id) => ipcRenderer.invoke('download:cancel', id),
  retry: (id) => ipcRenderer.invoke('download:retry', id),
  onQueueUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('download:queueUpdate', listener);
    return () => ipcRenderer.removeListener('download:queueUpdate', listener);
  }
});
```

- [ ] **Step 4: Create renderer shell**

```jsx
// src/renderer/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
```

```html
<!-- index.html -->
<div id="root"></div>
<script type="module" src="/src/renderer/main.jsx"></script>
```

- [ ] **Step 5: Run scaffold**

Run: `npm install`

Expected: dependencies install.

Run: `npm run build`

Expected: Vite build succeeds.

## Task 2: Pure Helper Tests

**Files:**
- Create: `src/main/services/url.js`
- Create: `src/main/services/formatMapper.js`
- Create: `src/main/services/progressParser.js`
- Create: `tests/url.test.js`
- Create: `tests/formatMapper.test.js`
- Create: `tests/progressParser.test.js`

- [ ] **Step 1: Add URL validation tests**

```js
import { describe, expect, it } from 'vitest';
import { parseYouTubeUrl } from '../src/main/services/url.js';

describe('parseYouTubeUrl', () => {
  it('accepts a video URL', () => {
    expect(parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ type: 'video', id: 'dQw4w9WgXcQ' });
  });

  it('accepts a playlist URL', () => {
    expect(parseYouTubeUrl('https://www.youtube.com/playlist?list=PL123456789')).toEqual({ type: 'playlist', id: 'PL123456789' });
  });

  it('rejects non-YouTube URLs', () => {
    expect(parseYouTubeUrl('https://example.com')).toBeNull();
  });
});
```

- [ ] **Step 2: Implement URL parser**

```js
export function parseYouTubeUrl(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, '');
    if (!['youtube.com', 'youtu.be', 'music.youtube.com'].includes(host)) return null;

    const playlistId = url.searchParams.get('list');
    if (playlistId) return { type: 'playlist', id: playlistId };

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? { type: 'video', id } : null;
    }

    const videoId = url.searchParams.get('v');
    return videoId ? { type: 'video', id: videoId } : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Add progress parser tests and implementation**

```js
import { describe, expect, it } from 'vitest';
import { parseProgressLine } from '../src/main/services/progressParser.js';

describe('parseProgressLine', () => {
  it('parses yt-dlp download progress', () => {
    expect(parseProgressLine('[download]  42.3% of 50.00MiB at 8.40MiB/s ETA 00:18')).toMatchObject({
      phase: 'downloading',
      percent: 42.3,
      speed: '8.40MiB/s',
      eta: '00:18'
    });
  });
});
```

```js
export function parseProgressLine(line) {
  if (line.includes('[Merger]') || line.includes('Merging formats')) return { phase: 'merging' };
  if (line.includes('[ExtractAudio]')) return { phase: 'converting' };

  const match = line.match(/\[download\]\s+([\d.]+)%.*?at\s+([^\s]+)\s+ETA\s+([^\s]+)/);
  if (!match) return null;

  return {
    phase: 'downloading',
    percent: Number(match[1]),
    speed: match[2],
    eta: match[3]
  };
}
```

- [ ] **Step 4: Add format mapper tests and implementation**

```js
import { describe, expect, it } from 'vitest';
import { buildFormatSelector } from '../src/main/services/formatMapper.js';

describe('buildFormatSelector', () => {
  it('uses best video and audio for best MP4', () => {
    expect(buildFormatSelector({ mode: 'video', quality: 'best' })).toBe('bv*+ba/b');
  });

  it('caps video height', () => {
    expect(buildFormatSelector({ mode: 'video', quality: '720' })).toBe('bv*[height<=720]+ba/b[height<=720]');
  });

  it('uses audio selector for audio mode', () => {
    expect(buildFormatSelector({ mode: 'audio', audioFormat: 'mp3' })).toBe('ba/b');
  });
});
```

```js
export function buildFormatSelector(options) {
  if (options.mode === 'audio') return 'ba/b';
  if (options.quality === 'best') return 'bv*+ba/b';
  return `bv*[height<=${options.quality}]+ba/b[height<=${options.quality}]`;
}
```

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: all helper tests pass.

## Task 3: Metadata and Download Manager

**Files:**
- Create: `src/main/services/metadataService.js`
- Create: `src/main/services/downloadManager.js`
- Modify: `src/main/main.js`

- [ ] **Step 1: Implement metadata lookup**

```js
import { spawn } from 'node:child_process';

export function inspectUrl(url, tools = { ytDlp: 'yt-dlp' }) {
  return new Promise((resolve, reject) => {
    const child = spawn(tools.ytDlp, ['--dump-single-json', '--no-warnings', url], { windowsHide: true });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || 'Metadata lookup failed'));
        return;
      }
      const raw = JSON.parse(stdout);
      resolve({
        type: raw._type === 'playlist' ? 'playlist' : 'video',
        title: raw.title,
        channel: raw.uploader || raw.channel,
        duration: raw.duration,
        thumbnail: raw.thumbnail,
        itemCount: raw.entries?.length || 1,
        formats: raw.formats || []
      });
    });
  });
}
```

- [ ] **Step 2: Implement queue manager**

```js
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { buildFormatSelector } from './formatMapper.js';
import { parseProgressLine } from './progressParser.js';

export class DownloadManager {
  constructor(sendUpdate, tools = { ytDlp: 'yt-dlp' }) {
    this.sendUpdate = sendUpdate;
    this.tools = tools;
    this.items = [];
    this.active = null;
  }

  enqueue(request) {
    const item = { id: randomUUID(), status: 'queued', progress: 0, ...request };
    this.items.push(item);
    this.sendUpdate(this.items);
    this.startNext();
    return item;
  }

  cancel(id) {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) return false;
    item.status = 'canceled';
    item.process?.kill();
    this.sendUpdate(this.items);
    return true;
  }

  retry(id) {
    const item = this.items.find((entry) => entry.id === id);
    if (!item || item.status !== 'failed') return false;
    item.status = 'queued';
    item.error = null;
    item.progress = 0;
    this.sendUpdate(this.items);
    this.startNext();
    return true;
  }

  startNext() {
    if (this.active) return;
    const item = this.items.find((entry) => entry.status === 'queued');
    if (!item) return;

    item.status = 'downloading';
    this.active = item;
    const args = this.buildArgs(item);
    const child = spawn(this.tools.ytDlp, args, { windowsHide: true });
    item.process = child;

    child.stdout.on('data', (chunk) => this.handleOutput(item, chunk.toString()));
    child.stderr.on('data', (chunk) => this.handleOutput(item, chunk.toString()));
    child.on('close', (code) => {
      item.process = null;
      item.status = code === 0 && item.status !== 'canceled' ? 'completed' : item.status === 'canceled' ? 'canceled' : 'failed';
      if (item.status === 'completed') item.progress = 100;
      this.active = null;
      this.sendUpdate(this.items);
      this.startNext();
    });
  }

  buildArgs(item) {
    const output = path.join(item.folder, '%(title).180B.%(ext)s');
    const args = ['--newline', '-o', output, '-f', buildFormatSelector(item), item.url];
    if (item.mode === 'audio') args.unshift('--extract-audio', '--audio-format', item.audioFormat || 'mp3');
    if (item.mode === 'video') args.unshift('--merge-output-format', 'mp4');
    return args;
  }

  handleOutput(item, text) {
    for (const line of text.split(/\r?\n/)) {
      const parsed = parseProgressLine(line);
      if (!parsed) continue;
      item.phase = parsed.phase;
      if (parsed.percent !== undefined) item.progress = parsed.percent;
      item.speed = parsed.speed;
      item.eta = parsed.eta;
      this.sendUpdate(this.items);
    }
  }
}
```

- [ ] **Step 3: Wire IPC handlers**

```js
// add to src/main/main.js
import { inspectUrl } from './services/metadataService.js';
import { DownloadManager } from './services/downloadManager.js';

let mainWindow;
let manager;

function createWindow() {
  mainWindow = new BrowserWindow(/* same options as Task 1 */);
  manager = new DownloadManager((items) => mainWindow.webContents.send('download:queueUpdate', items));
  // load URL or file as in Task 1
}

ipcMain.handle('download:inspectUrl', async (_event, url) => inspectUrl(url));
ipcMain.handle('download:enqueue', async (_event, request) => manager.enqueue(request));
ipcMain.handle('download:cancel', async (_event, id) => manager.cancel(id));
ipcMain.handle('download:retry', async (_event, id) => manager.retry(id));
```

## Task 4: User Interface

**Files:**
- Modify: `src/renderer/App.jsx`
- Create: `src/renderer/components/UrlBar.jsx`
- Create: `src/renderer/components/PreviewPanel.jsx`
- Create: `src/renderer/components/SettingsPanel.jsx`
- Create: `src/renderer/components/DownloadQueue.jsx`
- Modify: `src/renderer/styles.css`

- [ ] **Step 1: Build app state and screen composition**

```jsx
import { useEffect, useState } from 'react';
import { UrlBar } from './components/UrlBar.jsx';
import { PreviewPanel } from './components/PreviewPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { DownloadQueue } from './components/DownloadQueue.jsx';

export default function App() {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({ mode: 'video', quality: 'best', audioFormat: 'mp3', folder: '' });

  useEffect(() => window.downloader.onQueueUpdate(setQueue), []);

  async function inspect() {
    setError('');
    try {
      setPreview(await window.downloader.inspectUrl(url));
    } catch {
      setPreview(null);
      setError('Не удалось получить предпросмотр. Проверьте ссылку и попробуйте ещё раз.');
    }
  }

  async function enqueue() {
    if (!preview || !settings.folder) {
      setError('Выберите ссылку и папку сохранения перед скачиванием.');
      return;
    }
    await window.downloader.enqueue({ url, title: preview.title, ...settings });
  }

  return (
    <main className="app">
      <UrlBar url={url} onUrlChange={setUrl} onInspect={inspect} />
      {error && <div className="notice">{error}</div>}
      <section className="workspace">
        <PreviewPanel preview={preview} />
        <SettingsPanel settings={settings} onChange={setSettings} onDownload={enqueue} />
      </section>
      <DownloadQueue items={queue} />
    </main>
  );
}
```

- [ ] **Step 2: Implement components**

Each component should be controlled and small. Use native buttons/selects/inputs with clear labels in Russian. `SettingsPanel` calls `window.downloader.selectFolder()` for folder selection. `DownloadQueue` calls cancel and retry APIs per row.

- [ ] **Step 3: Style approved layout**

Use a calm two-column desktop layout, stable panel sizes, 8px or smaller radii, clear progress bars, and responsive collapse below 900px. Avoid marketing hero sections; the app opens directly into the downloader workflow.

## Task 5: Build and Installer Verification

**Files:**
- Modify: `package.json` if build metadata needs adjustment.

- [ ] **Step 1: Run unit tests**

Run: `npm test`

Expected: URL, format mapper, and progress parser tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: renderer build succeeds and `dist/` is created.

- [ ] **Step 3: Run desktop app locally**

Run: set `VITE_DEV_SERVER_URL=http://127.0.0.1:5173` and start Electron while Vite is running.

Expected: app opens, URL field is usable, folder picker opens, and queue area renders.

- [ ] **Step 4: Build Windows installer**

Run: `npm run dist`

Expected: NSIS installer appears in `dist/` or `release/` output.

## Self-Review

Spec coverage:

- Windows desktop app and installer: Task 1 and Task 5.
- Paste video/playlist link and preview: Task 3 and Task 4.
- Quality selection and audio mode: Task 2, Task 3, Task 4.
- Queue, speed, ETA, progress: Task 2, Task 3, Task 4.
- Friendly errors: Task 4.
- Testing: Task 2 and Task 5.

Placeholder scan:

- No TBD/TODO placeholders are present.

Type consistency:

- Renderer calls `inspectUrl`, `enqueue`, `cancel`, `retry`, `selectFolder`, and `onQueueUpdate`; preload exposes the same names.
- Queue item fields used by UI are produced by `DownloadManager`.
