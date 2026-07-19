import { spawn } from 'node:child_process';
import { getAvailableQualities } from './formatMapper.js';

function runJson(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', () => {
      reject(new Error('Компонент yt-dlp не найден. Переустановите приложение.'));
    });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(toUserMessage(stderr)));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Не удалось прочитать ответ YouTube. Попробуйте ещё раз.'));
      }
    });
  });
}

function toUserMessage(stderr) {
  const text = stderr || '';
  if (text.includes('Video unavailable')) return 'Видео недоступно для скачивания.';
  if (text.includes('Private video')) return 'Это приватное видео недоступно.';
  if (text.includes('Unsupported URL')) return 'Ссылка не поддерживается.';
  if (text.includes('network') || text.includes('Unable to download webpage')) {
    return 'Соединение прервалось. Проверьте интернет и попробуйте ещё раз.';
  }
  return 'Не удалось получить предпросмотр. Проверьте ссылку и попробуйте ещё раз.';
}

function normalizeEntry(entry) {
  const videoId = entry.id || entry.url;
  return {
    id: videoId,
    title: entry.title || 'Без названия',
    channel: entry.uploader || entry.channel || '',
    duration: entry.duration || 0,
    thumbnail: entry.thumbnail || entry.thumbnails?.at?.(-1)?.url || '',
    webpageUrl: entry.webpage_url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : entry.url)
  };
}

export async function inspectUrl(url, tools = { ytDlp: 'yt-dlp' }) {
  const raw = await runJson(tools.ytDlp, ['--dump-single-json', '--no-warnings', '--flat-playlist', url]);
  const isPlaylist = raw._type === 'playlist' || Array.isArray(raw.entries);
  const entries = Array.isArray(raw.entries) ? raw.entries.map(normalizeEntry) : [];

  if (isPlaylist) {
    return {
      type: 'playlist',
      title: raw.title || 'Плейлист YouTube',
      channel: raw.uploader || raw.channel || '',
      duration: 0,
      thumbnail: raw.thumbnail || entries.find((entry) => entry.thumbnail)?.thumbnail || '',
      itemCount: entries.length,
      entries,
      qualities: [{ value: 'best', label: 'Лучшее доступное' }]
    };
  }

  const detailed = raw.formats ? raw : await runJson(tools.ytDlp, ['--dump-single-json', '--no-warnings', url]);
  return {
    type: 'video',
    ...normalizeEntry(detailed),
    itemCount: 1,
    entries: [],
    qualities: getAvailableQualities(detailed.formats || [])
  };
}
