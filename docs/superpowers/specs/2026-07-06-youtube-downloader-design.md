# YouTube Downloader for Windows - Design Spec

Date: 2026-07-06

## Goal

Build a Windows desktop application that lets a user download YouTube videos or entire playlists by pasting a link. The first release focuses on a single clear workflow: paste link, preview result, choose format and quality, start download, track progress and speed.

The app is intended for legitimate personal use only. It should not bypass paid access, private content, DRM, or regional restrictions.

## Platform

- Target platform: Windows.
- Distribution: installable desktop app with a Windows installer.
- Recommended app shell: Electron with a React/Vite renderer.
- Download engine: a local worker process around a maintained command-line downloader such as `yt-dlp`, with `ffmpeg` available for video/audio merging and audio conversion.

## First Release Scope

Included:

- Paste a YouTube video URL.
- Paste a YouTube playlist URL.
- Validate the link before download.
- Show preview before download.
- Show title, thumbnail, channel/uploader, duration, item count for playlists, and available quality choices.
- Download video as MP4.
- Download audio-only as MP3 or M4A.
- Let the user choose video quality before download.
- Let the user choose the save folder.
- Queue playlist items.
- Show progress, current speed, downloaded size, estimated time remaining, and per-item status.
- Allow pause/cancel where the underlying download process supports it.
- Show friendly error messages with retry actions.

Not included in the first release:

- Text search inside YouTube.
- User accounts.
- Cloud sync.
- Mobile versions.
- Advanced library management.
- Automatic subtitle translation.

## Main Screen

The approved structure is one focused workspace:

1. Top input bar
   - URL field.
   - Primary action: "Check" / "Проверить".
   - Clear/paste affordances can be added if they remain lightweight.

2. Preview panel
   - Large thumbnail.
   - Video or playlist title.
   - Channel/uploader.
   - Duration for single videos.
   - Playlist item count for playlists.
   - Estimated output size when available.

3. Download settings panel
   - Format mode: video or audio-only.
   - Video quality selector: best, 1080p, 720p, 480p, or available source qualities.
   - Audio format selector: MP3 or M4A.
   - Save folder picker.
   - Main action: add to downloads / start download.

4. Queue and progress area
   - Active downloads at the top.
   - Playlist items listed as separate rows.
   - Each row shows filename, status, progress percent, speed, ETA, and actions.
   - Completed items remain visible until the user clears them.

## Playlist Behavior

When the user pastes a playlist URL, the app fetches playlist metadata and shows a playlist preview. The user can download the whole playlist in one action.

Initial behavior:

- Add every playlist item to the queue.
- Use the selected format and quality for all items.
- Continue with the next item if one item fails.
- Show failed items with a retry button.
- Keep a concise summary: completed, failed, remaining.

Future enhancement:

- Let users select individual playlist items before starting.

## Quality Selection

The quality selector should be based on available formats returned by the download engine. The UI should avoid promising qualities that are not available for the current video.

Rules:

- "Best" selects the best available video plus audio.
- Specific video heights choose the closest available format at or below that height.
- If a requested quality is unavailable, the app explains the fallback before starting or uses a clearly labeled fallback option.
- Audio-only mode hides video quality and shows audio format/quality choices instead.

## Download Progress

The app parses progress events from the worker process and normalizes them into UI state.

Progress fields:

- Percent complete.
- Current speed.
- Downloaded size.
- Total size when known.
- ETA when known.
- Current phase: fetching metadata, downloading, merging, converting, completed, failed, canceled.

The UI must clearly show when a file is no longer downloading but is still being merged or converted.

## Error Handling

Errors should be written for normal users, not developers.

Examples:

- Invalid link: "Ссылка не похожа на видео или плейлист YouTube."
- Video unavailable: "Видео недоступно для скачивания."
- Network failure: "Соединение прервалось. Попробуйте ещё раз."
- Missing engine dependency: "Компонент загрузки не найден. Переустановите приложение."
- FFmpeg failure: "Не удалось объединить видео и аудио. Попробуйте другое качество."

Each recoverable error should offer a next action: retry, choose another quality, open folder, or remove from queue.

## Data and Settings

Local settings:

- Last save folder.
- Last selected format mode.
- Last selected quality.
- Last selected audio format.
- Window size.

Download history is optional for the first release. If present, it should stay local.

## Architecture

Recommended modules:

- App shell: creates the Windows app window and installer package.
- Renderer UI: React screens and components.
- IPC bridge: safe commands between UI and main process.
- Metadata service: validates URLs and fetches preview/format information.
- Download manager: queue, process lifecycle, pause/cancel/retry.
- Progress parser: converts downloader output into structured progress events.
- Settings store: local user preferences.

The UI should never call the downloader directly. It sends requests to the main process through a narrow API.

## Testing and Verification

Minimum checks before calling the first release complete:

- App launches on Windows.
- User can paste a single video URL and see metadata preview.
- User can choose MP4 quality and download successfully.
- User can choose audio-only and download successfully.
- User can paste a playlist URL and queue all items.
- Progress percent and speed update during download.
- Failed downloads show a readable error and retry option.
- Installer builds successfully.
- The interface works at common laptop sizes without text overlap.

## Approved UX Direction

The selected product approach is option B: one convenient download panel. This avoids a heavy media-library interface while still giving users the expected controls for preview, quality, playlists, audio mode, and progress tracking.
