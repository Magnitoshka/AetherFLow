const { contextBridge, ipcRenderer } = require('electron');

/**
 * Мост безопасного взаимодействия между главным (Main) и рендерер (Renderer) процессами.
 * Внедряет API `downloader` в глобальный объект `window`.
 * 
 * Внимание: Файл сохранён с расширением .cjs (CommonJS), так как ES-импорты в предзагрузке
 * вызывают синтаксическую ошибку при включённой песочнице (sandbox: true).
 */
contextBridge.exposeInMainWorld('downloader', {
  // Выбор папки через стандартное диалоговое окно системы
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  
  // Получение метаданных видео или плейлиста по ссылке
  inspectUrl: (url) => ipcRenderer.invoke('download:inspectUrl', url),
  
  // Добавление ссылки на видео или плейлист в очередь скачивания
  enqueue: (request) => ipcRenderer.invoke('download:enqueue', request),
  
  // Отмена конкретной загрузки по её UUID
  cancel: (id) => ipcRenderer.invoke('download:cancel', id),
  
  // Отмена всех загрузок в очереди сразу
  cancelAll: () => ipcRenderer.invoke('download:cancelAll'),
  
  // Повторная отправка упавшей загрузки в очередь
  retry: (id) => ipcRenderer.invoke('download:retry', id),
  
  // Проверка статуса yt-dlp и ffmpeg
  checkTools: () => ipcRenderer.invoke('tools:check'),
  
  // Подписка на обновления очереди скачивания
  onQueueUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('download:queueUpdate', listener);
    return () => ipcRenderer.removeListener('download:queueUpdate', listener);
  }
});
