/**
 * Заглушка метаданных для браузерного предпросмотра.
 */
const mockPreview = {
  type: 'video',
  title: 'Тестовый предпросмотр YouTube',
  channel: 'Demo channel',
  duration: 245,
  thumbnail: '',
  itemCount: 1,
  entries: [],
  qualities: [
    { value: 'best', label: 'Лучшее доступное' },
    { value: '1080', label: '1080p' },
    { value: '720', label: '720p' }
  ]
};

/**
 * Создает мок-версию API для тестирования интерфейса прямо в браузере (вне Electron).
 */
function createBrowserFallback() {
  let queue = [];
  const listeners = new Set();

  function emit() {
    listeners.forEach((listener) => listener(queue));
  }

  return {
    selectFolder: async () => 'C:\\Downloads',
    inspectUrl: async (url) => {
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        throw new Error('Ссылка не похожа на видео или плейлист YouTube.');
      }
      return mockPreview;
    },
    enqueue: async (request) => {
      const item = {
        id: String(Date.now()),
        title: request.preview?.title || 'Тестовая загрузка',
        status: 'downloading',
        phase: 'downloading',
        progress: 42,
        speed: '8.4MiB/s',
        eta: '00:18'
      };
      queue = [item, ...queue];
      emit();
      return item;
    },
    cancel: async (id) => {
      queue = queue.map((item) => (item.id === id ? { ...item, status: 'canceled', phase: 'canceled' } : item));
      emit();
      return true;
    },
    cancelAll: async () => {
      queue = queue.map((item) =>
        ['queued', 'downloading'].includes(item.status)
          ? { ...item, status: 'canceled', phase: 'canceled' }
          : item
      );
      emit();
      return true;
    },
    retry: async (id) => {
      queue = queue.map((item) => (item.id === id ? { ...item, status: 'queued', phase: 'queued', progress: 0 } : item));
      emit();
      return true;
    },
    checkTools: async () => ({ ytDlp: false, ffmpeg: false, browserPreview: true }),
    onQueueUpdate: (callback) => {
      listeners.add(callback);
      callback(queue);
      return () => listeners.delete(callback);
    }
  };
}

/**
 * Создает резервную заглушку на случай сбоя загрузки preload-моста в Electron.
 */
function createMissingBridgeApi() {
  return {
    selectFolder: async () => '',
    inspectUrl: async () => {
      throw new Error('Внутренний модуль приложения не загрузился. Переустановите приложение.');
    },
    enqueue: async () => {
      throw new Error('Внутренний модуль приложения не загрузился. Переустановите приложение.');
    },
    cancel: async () => false,
    cancelAll: async () => false,
    retry: async () => false,
    checkTools: async () => ({ ytDlp: false, ffmpeg: false, bridgeMissing: true }),
    onQueueUpdate: (callback) => {
      callback([]);
      return () => {};
    }
  };
}

// Проверяем, запущено ли приложение в обычном браузере (например, при npm run dev в браузере)
const isBrowserDev = window.location.protocol.startsWith('http');

/**
 * Экспортируемый объект API для взаимодействия с главным процессом.
 * По приоритету выбирает:
 * 1. window.downloader (если запущен под Electron c успешным preload.cjs)
 * 2. Браузерную заглушку (если запущен в браузере на localhost)
 * 3. Ошибку моста (если запущен под Electron, но preload-скрипт упал)
 */
export const downloaderApi = window.downloader || (isBrowserDev ? createBrowserFallback() : createMissingBridgeApi());
