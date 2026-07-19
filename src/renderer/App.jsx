import { useEffect, useMemo, useState } from 'react';
import { Plus, Settings, Sparkles } from 'lucide-react';
import { DownloadQueue } from './components/DownloadQueue.jsx';
import { PreviewPanel } from './components/PreviewPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { ToolStatus } from './components/ToolStatus.jsx';
import { UrlBar } from './components/UrlBar.jsx';
import { downloaderApi } from './downloaderApi.js';

const defaultSettings = {
  mode: 'video',
  quality: 'best',
  audioFormat: 'mp3',
  folder: ''
};

const dictionary = {
  ru: {
    activeDownloads: 'Активные загрузки',
    appStatus: 'Статус приложения',
    settings: 'Настройки',
    language: 'Язык',
    linkLabel: 'Вставьте ссылку на видео или плейлист',
    previewError: 'Не удалось получить предпросмотр. Проверьте ссылку и попробуйте еще раз.',
    inspectFirst: 'Сначала проверьте ссылку и дождитесь предпросмотра.',
    folderFirst: 'Выберите папку сохранения перед скачиванием.',
    enqueueError: 'Не удалось добавить загрузку.',
    playlist: 'Плейлист',
    playlists: 'Плейлисты',
    videos: 'видео',
    playlistEmpty: 'Плейлисты появятся после проверки ссылки.',
    overallProgress: 'Общий прогресс',
    ready: 'готово'
  },
  en: {
    activeDownloads: 'Active downloads',
    appStatus: 'Application status',
    settings: 'Settings',
    language: 'Language',
    linkLabel: 'Paste a video or playlist link',
    previewError: 'Could not load the preview. Check the link and try again.',
    inspectFirst: 'Check the link and wait for the preview first.',
    folderFirst: 'Choose a save folder before downloading.',
    enqueueError: 'Could not add the download.',
    playlist: 'Playlist',
    playlists: 'Playlists',
    videos: 'videos',
    playlistEmpty: 'Playlists will appear after checking a link.',
    overallProgress: 'Overall progress',
    ready: 'ready'
  }
};

export default function App() {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  const [isInspecting, setInspecting] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [tools, setTools] = useState({ ytDlp: false, ffmpeg: false, checking: true });
  const [language, setLanguage] = useState(() => localStorage.getItem('aetherflow-language') || 'ru');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const copy = dictionary[language] || dictionary.ru;

  useEffect(() => downloaderApi.onQueueUpdate(setQueue), []);

  useEffect(() => {
    localStorage.setItem('aetherflow-language', language);
  }, [language]);

  useEffect(() => {
    downloaderApi
      .checkTools()
      .then((status) => setTools({ ...status, checking: false }))
      .catch(() => setTools({ ytDlp: false, ffmpeg: false, checking: false }));
  }, []);

  const selectedQuality = useMemo(() => {
    if (!preview?.qualities?.length) return settings.quality;
    return preview.qualities.some((quality) => quality.value === settings.quality)
      ? settings.quality
      : preview.qualities[0].value;
  }, [preview, settings.quality]);

  const activeCount = queue.filter((item) => ['queued', 'downloading'].includes(item.status)).length;
  const completedCount = queue.filter((item) => item.status === 'completed').length;

  const overallProgress = useMemo(() => {
    if (!queue.length) return 0;
    return Math.round(queue.reduce((sum, item) => sum + (item.progress || 0), 0) / queue.length);
  }, [queue]);

  const playlistSummary = useMemo(() => {
    const groups = new Map();

    queue.forEach((item) => {
      if (!item.playlistId) return;
      const current = groups.get(item.playlistId) || {
        id: item.playlistId,
        title: item.playlistTitle || copy.playlist,
        count: 0,
        active: 0
      };
      current.count += 1;
      if (['queued', 'downloading'].includes(item.status)) current.active += 1;
      groups.set(item.playlistId, current);
    });

    if (preview?.type === 'playlist' && ![...groups.values()].some((group) => group.title === preview.title)) {
      groups.set('preview', {
        id: 'preview',
        title: preview.title || copy.playlist,
        count: preview.itemCount || preview.entries?.length || 0,
        active: 0
      });
    }

    return [...groups.values()].slice(0, 5);
  }, [copy.playlist, preview, queue]);

  function switchLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setSettingsOpen(false);
  }

  async function inspect() {
    setError('');
    setPreview(null);
    setInspecting(true);
    try {
      const nextPreview = await downloaderApi.inspectUrl(url);
      setPreview(nextPreview);
      if (nextPreview.qualities?.length) {
        setSettings((current) => ({ ...current, quality: nextPreview.qualities[0].value }));
      }
    } catch (err) {
      setError(err?.message || copy.previewError);
    } finally {
      setInspecting(false);
    }
  }

  async function enqueue() {
    setError('');
    if (!preview) {
      setError(copy.inspectFirst);
      return;
    }
    if (!settings.folder) {
      setError(copy.folderFirst);
      return;
    }
    try {
      await downloaderApi.enqueue({
        url,
        preview,
        ...settings,
        quality: selectedQuality
      });
    } catch (err) {
      setError(err?.message || copy.enqueueError);
    }
  }

  return (
    <main className="app-shell">
      <section className="app-frame">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">
              <Sparkles size={18} />
            </div>
            <strong>AetherFlow</strong>
          </div>
          <div className="window-actions" aria-label={copy.appStatus}>
            <span title={copy.activeDownloads}>{activeCount}</span>
            <div className="settings-menu">
              <button
                type="button"
                title={copy.settings}
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((current) => !current)}
              >
                <Settings size={15} />
              </button>
              {settingsOpen && (
                <div className="settings-popover">
                  <span>{copy.language}</span>
                  <div className="language-toggle">
                    <button
                      type="button"
                      className={language === 'ru' ? 'active' : ''}
                      onClick={() => switchLanguage('ru')}
                    >
                      Rus
                    </button>
                    <button
                      type="button"
                      className={language === 'en' ? 'active' : ''}
                      onClick={() => switchLanguage('en')}
                    >
                      Eng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-grid">
          <section className="main-stage">
            <ToolStatus tools={tools} language={language} />

            <div className="url-section">
              <label htmlFor="youtube-url">{copy.linkLabel}</label>
              <UrlBar
                url={url}
                onUrlChange={setUrl}
                onInspect={inspect}
                isInspecting={isInspecting}
                inputId="youtube-url"
                language={language}
              />
            </div>

            {error && <div className="notice">{error}</div>}

            <PreviewPanel preview={preview} isLoading={isInspecting} language={language} />

            <SettingsPanel
              preview={preview}
              settings={{ ...settings, quality: selectedQuality }}
              onChange={setSettings}
              onDownload={enqueue}
              onSelectFolder={downloaderApi.selectFolder}
              language={language}
            />
          </section>

          <aside className="side-stage">
            <section className="rail-section">
              <div className="rail-header">
                <h2>{copy.playlists}</h2>
                <Plus size={16} />
              </div>
              <div className="playlist-list">
                {playlistSummary.length ? (
                  playlistSummary.map((playlist) => (
                    <div className="playlist-row" key={playlist.id}>
                      <span>{playlist.title}</span>
                      <small>{playlist.count || playlist.active} {copy.videos}</small>
                    </div>
                  ))
                ) : (
                  <div className="rail-empty">{copy.playlistEmpty}</div>
                )}
              </div>
            </section>

            <DownloadQueue
              items={queue}
              onCancel={downloaderApi.cancel}
              onCancelAll={downloaderApi.cancelAll}
              onRetry={downloaderApi.retry}
              language={language}
            />
          </aside>
        </div>

        <footer className="bottom-progress">
          <span>{copy.overallProgress}</span>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${overallProgress}%` }} />
          </div>
          <strong>{overallProgress}%</strong>
          <span className="complete-count">{completedCount} {copy.ready}</span>
        </footer>
      </section>
    </main>
  );
}
