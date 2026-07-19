import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const copy = {
  ru: {
    checkingText: 'Проверяем компоненты загрузки...',
    checking: 'Проверка',
    readyText: 'yt-dlp и ffmpeg встроены. Можно скачивать видео, аудио и плейлисты.',
    browserText: 'Открыт браузерный предпросмотр. В установленном приложении будут встроенные компоненты.',
    bridgeText: 'Модуль Electron не подключился. Установите свежую сборку 1.1.',
    missingText: 'Компоненты загрузки не найдены. Переустановите приложение свежей сборкой.',
    ready: 'Готово',
    check: 'Проверить'
  },
  en: {
    checkingText: 'Checking download components...',
    checking: 'Checking',
    readyText: 'yt-dlp and ffmpeg are bundled. Video, audio, and playlist downloads are ready.',
    browserText: 'Browser preview is open. The installed app will use bundled download components.',
    bridgeText: 'Electron module is not connected. Install the fresh 1.1 build.',
    missingText: 'Download components were not found. Reinstall the app with the fresh build.',
    ready: 'Ready',
    check: 'Check'
  }
};

export function ToolStatus({ tools, language = 'ru' }) {
  const text = copy[language] || copy.ru;

  if (tools.checking) {
    return (
      <div className="tool-status">
        <span>{text.checkingText}</span>
        <strong>{text.checking}</strong>
      </div>
    );
  }

  const ready = tools.ytDlp && tools.ffmpeg;
  const message = ready
    ? text.readyText
    : tools.browserPreview
      ? text.browserText
      : tools.bridgeMissing
        ? text.bridgeText
        : text.missingText;

  return (
    <div className={`tool-status ${ready ? 'ok' : 'warn'}`}>
      <span>{message}</span>
      <strong>
        {ready ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
        {ready ? text.ready : text.check}
      </strong>
    </div>
  );
}
