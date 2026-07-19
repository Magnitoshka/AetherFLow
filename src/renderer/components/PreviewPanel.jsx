import { Clock, ListVideo, Pause, Play, UserRound } from 'lucide-react';

const copy = {
  ru: {
    preview: 'Предпросмотр',
    playlist: 'Плейлист',
    video: 'Видео',
    waiting: 'Ожидание ссылки',
    loading: 'Получаем данные с YouTube...',
    emptyTitle: 'Предпросмотр появится здесь',
    videos: 'видео',
    readyText: 'Проверьте качество и папку сохранения ниже, затем добавьте загрузку в очередь.',
    emptyText: 'Вставьте ссылку, нажмите проверку, и приложение покажет название, канал, обложку и доступные варианты качества.'
  },
  en: {
    preview: 'Preview',
    playlist: 'Playlist',
    video: 'Video',
    waiting: 'Waiting for a link',
    loading: 'Loading data from YouTube...',
    emptyTitle: 'Preview will appear here',
    videos: 'videos',
    readyText: 'Check the quality and save folder below, then add the download to the queue.',
    emptyText: 'Paste a link, press check, and the app will show the title, channel, thumbnail, and available quality options.'
  }
};

function formatDuration(seconds) {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = Math.floor(seconds % 60);
  return [hours, minutes, rest]
    .filter((value, index) => index > 0 || value > 0)
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function PreviewPanel({ preview, isLoading, language = 'ru' }) {
  const text = copy[language] || copy.ru;

  return (
    <section className="preview-panel">
      <div className="preview-art">
        {preview?.thumbnail ? (
          <img src={preview.thumbnail} alt="" />
        ) : (
          <div className="preview-fallback">
            <Play size={34} />
          </div>
        )}
        <button className="preview-play" type="button" title={text.preview}>
          <Pause size={15} />
        </button>
        {preview?.duration > 0 && <span className="preview-duration">{formatDuration(preview.duration)}</span>}
      </div>

      <div className="preview-copy">
        <div className="preview-kicker">
          {preview?.type === 'playlist' ? <ListVideo size={14} /> : <Play size={14} />}
          {preview ? (preview.type === 'playlist' ? text.playlist : text.video) : text.waiting}
        </div>
        <h1>{preview?.title || (isLoading ? text.loading : text.emptyTitle)}</h1>
        <div className="preview-meta">
          {preview?.channel && (
            <span>
              <UserRound size={14} /> {preview.channel}
            </span>
          )}
          {preview?.duration > 0 && (
            <span>
              <Clock size={14} /> {formatDuration(preview.duration)}
            </span>
          )}
          {preview?.itemCount > 1 && (
            <span>
              <ListVideo size={14} /> {preview.itemCount} {text.videos}
            </span>
          )}
        </div>
        <p>{preview ? text.readyText : text.emptyText}</p>
      </div>
    </section>
  );
}
