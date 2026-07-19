# Developer Guide

## Requirements

- Windows 10/11
- Node.js 18 or newer
- npm

## Install

```bash
npm install
```

## Development Flow

Run Vite:

```bash
npm run dev
```

Run Electron in a second terminal:

```bash
npm run start
```

## Tests

```bash
npm test
```

The test suite covers:

- YouTube URL parsing
- yt-dlp progress parsing
- format selector generation
- available quality mapping

## Production Build

```bash
npm run build
npm run dist
```

The installer is created in `release/`.

## Landing Download Export

After packaging, copy the installer into a folder with stable download filenames:

```bash
npm run landing:copy
```

The output goes to `landing-builds/`:

- `AetherFlow-Setup-latest.exe`
- `AetherFlow-Setup-<version>.exe`
- `manifest.json`

Upload these generated files to the landing host and point the download button to:

```text
/landing-builds/AetherFlow-Setup-latest.exe
```

## Electron Bridge

The project uses `src/main/preload.cjs` for the secure renderer bridge.

Keep it as CommonJS. The package uses `"type": "module"`, but Electron preload scripts are more reliable here as `.cjs`, especially in packaged builds.

The renderer talks to the main process through `window.downloader` exposed by the preload script.

## Bundled Tools

The packaged app expects these files in `resources/bin`:

- `yt-dlp.exe`
- `ffmpeg.exe`
- `vcruntime140.dll`
- `vcruntime140_1.dll`
- `msvcp140.dll`

Tool resolution lives in `src/main/services/tools.js`.

## Packaging Notes

The Vite config uses `base: './'` so packaged Electron can load assets from `dist/index.html`.

Electron Builder copies `resources/bin` into the packaged app through `extraResources`.
