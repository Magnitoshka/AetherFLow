import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildFormatSelector } from './formatMapper.js';
import { parseProgressLine } from './progressParser.js';

/**
 * Менеджер загрузок, контролирующий параллельно-последовательное скачивание медиафайлов.
 * Взаимодействует с yt-dlp по принципу FIFO-очереди (один активный поток скачивания).
 */
export class DownloadManager {
  constructor(sendUpdate, tools = { ytDlp: 'yt-dlp', ffmpeg: 'ffmpeg' }) {
    this.sendUpdate = sendUpdate; // Коллбек для отправки обновления очереди в UI
    this.tools = tools;           // Пути к исполняемым файлам
    this.items = [];              // Список всех элементов в очереди
    this.active = null;           // Ссылка на текущую активную задачу
  }

  /**
   * Добавляет задачу (или группу задач в случае плейлиста) в очередь.
   */
  enqueue(request) {
    const isPlaylist = request.preview?.type === 'playlist';
    const playlistTitle = isPlaylist ? (request.preview.title || 'Playlist') : '';
    const playlistId = isPlaylist ? randomUUID() : '';

    // Если скачивается плейлист, создаём для него отдельную папку по выбранному пути
    let targetFolder = request.folder;
    if (isPlaylist && playlistTitle) {
      const sanitized = playlistTitle.replace(/[\\/:*?"<>|]/g, '_').trim();
      targetFolder = path.join(request.folder, sanitized);
      try {
        fs.mkdirSync(targetFolder, { recursive: true });
      } catch (err) {
        console.error('Failed to create playlist folder:', err);
      }
    }

    const targets = isPlaylist && request.preview.entries?.length
      ? request.preview.entries
      : [request.preview || { title: request.title || 'YouTube video' }];

    const created = targets.map((target, index) => {
      const item = {
        id: randomUUID(),
        url: target.webpageUrl || request.url,
        title: target.title || request.preview?.title || 'YouTube video',
        folder: targetFolder,
        mode: request.mode,
        quality: request.quality,
        audioFormat: request.audioFormat,
        playlistTitle: playlistTitle,
        playlistId: playlistId,
        order: index + 1,
        status: 'queued',
        phase: 'queued',
        progress: 0,
        speed: '',
        eta: '',
        total: '',
        error: ''
      };
      this.items.push(item);
      return sanitizeItem(item);
    });

    this.emit();
    this.startNext();
    return created;
  }

  /**
   * Отменяет конкретную загрузку по её ID.
   */
  cancel(id) {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) return false;
    item.status = 'canceled';
    item.phase = 'canceled';
    item.process?.kill(); // Убиваем дочерний процесс yt-dlp, если он запущен
    this.emit();
    return true;
  }

  /**
   * Отменяет все активные и находящиеся в очереди загрузки.
   */
  cancelAll() {
    let changed = false;
    for (const item of this.items) {
      if (['queued', 'downloading'].includes(item.status)) {
        item.status = 'canceled';
        item.phase = 'canceled';
        item.process?.kill();
        changed = true;
      }
    }
    if (changed) {
      this.emit();
    }
    return true;
  }

  /**
   * Повторно отправляет задачу в очередь, если её скачивание завершилось ошибкой.
   */
  retry(id) {
    const item = this.items.find((entry) => entry.id === id);
    if (!item || item.status !== 'failed') return false;
    item.status = 'queued';
    item.phase = 'queued';
    item.error = '';
    item.progress = 0;
    this.emit();
    this.startNext();
    return true;
  }

  /**
   * Запускает следующее видео в очереди, если нет активной загрузки.
   */
  startNext() {
    if (this.active) return;
    const item = this.items.find((entry) => entry.status === 'queued');
    if (!item) return;

    item.status = 'downloading';
    item.phase = 'fetching';
    this.active = item;
    this.emit();

    // Запускаем процесс yt-dlp с нужными параметрами
    const child = spawn(this.tools.ytDlp, this.buildArgs(item), { windowsHide: true });
    item.process = child;

    // Парсим прогресс загрузки из консольного вывода
    child.stdout.on('data', (chunk) => this.handleOutput(item, chunk.toString()));
    child.stderr.on('data', (chunk) => this.handleOutput(item, chunk.toString()));
    
    child.on('error', () => {
      item.status = 'failed';
      item.phase = 'failed';
      item.error = 'Компонент yt-dlp не найден. Переустановите приложение.';
      this.active = null;
      this.emit();
      this.startNext();
    });

    child.on('close', (code) => {
      item.process = null;
      if (item.status !== 'canceled') {
        item.status = code === 0 ? 'completed' : 'failed';
        item.phase = item.status;
        if (item.status === 'completed') item.progress = 100;
        if (item.status === 'failed' && !item.error) {
          item.error = 'Загрузка не завершилась. Попробуйте другое качество или повторите позже.';
        }
      }
      this.active = null;
      this.emit();
      this.startNext();
    });
  }

  /**
   * Формирует список аргументов запуска для yt-dlp.
   */
  buildArgs(item) {
    const output = path.join(item.folder, '%(playlist_index|)s%(playlist_index& - |)s%(title).180B.%(ext)s');
    const args = [
      '--newline',
      '--no-warnings',
      '--ffmpeg-location',
      this.tools.ffmpeg,
      '-o',
      output,
      '-f',
      buildFormatSelector(item)
    ];

    if (item.mode === 'audio') {
      args.push('--extract-audio', '--audio-format', item.audioFormat || 'mp3');
    } else {
      args.push('--merge-output-format', 'mp4');
    }

    args.push(item.url);
    return args;
  }

  /**
   * Читает вывод консоли и передаёт его парсеру прогресса.
   */
  handleOutput(item, text) {
    for (const line of text.split(/\r?\n/)) {
      const parsed = parseProgressLine(line);
      if (parsed) {
        item.phase = parsed.phase;
        if (parsed.percent !== undefined) item.progress = parsed.percent;
        if (parsed.speed !== undefined) item.speed = parsed.speed;
        if (parsed.eta !== undefined) item.eta = parsed.eta;
        if (parsed.total !== undefined) item.total = parsed.total;
        this.emit();
      }

      if (/ERROR:/i.test(line)) {
        item.error = line.replace(/^.*ERROR:\s*/i, '').trim();
      }
    }
  }

  /**
   * Оповещает рендерер об обновлении очереди.
   */
  emit() {
    this.sendUpdate(this.items.map(sanitizeItem));
  }
}

/**
 * Очищает объект задачи от циклических зависимостей перед отправкой через IPC.
 */
function sanitizeItem(item) {
  const { process: _process, ...safe } = item;
  return safe;
}
