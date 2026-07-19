# Troubleshooting

## The App Opens With a Blank Screen

Run:

```bash
npm run build
npm run dist
```

Make sure `vite.config.js` keeps:

```js
base: './'
```

This allows Electron to load packaged assets from disk.

## Download Components Are Not Found

Check that bundled tools exist:

```bash
resources/bin/yt-dlp.exe --version
resources/bin/ffmpeg.exe -version
```

If the installed app shows this error, rebuild the installer and reinstall the fresh version:

```bash
npm run build
npm run dist
```

## Internal Module Did Not Load

Check that the packaged app contains:

```text
src/main/preload.cjs
```

The main window must point to `preload.cjs`, not an ES module preload file.

## YouTube Preview Fails

Possible causes:

- The link is private, restricted, or unavailable.
- YouTube changed metadata behavior.
- Network access is blocked.
- The bundled `yt-dlp.exe` is outdated.

Update `yt-dlp.exe` in `resources/bin` and rebuild.

## Download Fails on One Quality

Try `Best available` or a lower quality. Some videos do not provide every format combination.
