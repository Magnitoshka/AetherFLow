import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Возвращает путь к исполняемому файлу встроенной утилиты.
 * В зависимости от того, упаковано ли приложение, путь меняется:
 * - В режиме разработки: ресурсы берутся из корня проекта (cwd/resources/bin)
 * - В собранном приложении: ресурсы находятся в системной папке ресурсов (resourcesPath/bin)
 */
function resourceBin(app, executable) {
  if (!app?.isPackaged) return path.join(process.cwd(), 'resources', 'bin', executable);
  return path.join(process.resourcesPath, 'bin', executable);
}

/**
 * Находит первый существующий путь из списка кандидатов.
 */
function firstExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate));
}

/**
 * Определяет пути к исполняемым файлам утилит yt-dlp и ffmpeg.
 * Приоритет отдаётся встроенным бинарникам, затем путям из переменных окружения,
 * и в крайнем случае — системному вызову из PATH.
 */
export function resolveTools(app) {
  const ytDlpExe = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const ffmpegExe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

  return {
    ytDlp: firstExisting([resourceBin(app, ytDlpExe), process.env.YT_DLP_PATH]) || 'yt-dlp',
    ffmpeg: firstExisting([resourceBin(app, ffmpegExe), process.env.FFMPEG_PATH]) || 'ffmpeg'
  };
}

/**
 * Запускает процесс проверки работоспособности бинарного файла.
 * Возвращает Promise, который резолвится в boolean.
 */
function canRun(command, args = ['--version']) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { windowsHide: true });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Проверяет доступность и корректность работы yt-dlp и ffmpeg.
 * Внимание: ffmpeg проверяется с флагом '-version' вместо '--version'.
 */
export async function getToolStatus(tools) {
  const [ytDlp, ffmpeg] = await Promise.all([
    canRun(tools.ytDlp, ['--version']),
    canRun(tools.ffmpeg, ['-version']) // У ffmpeg двойной дефис вызывает ошибку
  ]);
  return {
    ytDlp,
    ffmpeg,
    ytDlpPath: tools.ytDlp,
    ffmpegPath: tools.ffmpeg
  };
}
