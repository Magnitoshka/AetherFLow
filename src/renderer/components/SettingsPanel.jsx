import { Download, FolderOpen, Music, Video } from 'lucide-react';

const copy = {
  ru: {
    best: 'Лучшее доступное',
    files: 'файлов',
    auto: 'Авто',
    afterCheck: 'После проверки',
    video: 'Видео (MP4)',
    audio: 'Аудио (MP3)',
    quality: 'Качество',
    audioFormat: 'Формат аудио',
    size: 'Размер',
    noFolder: 'Папка не выбрана',
    choose: 'Выбрать',
    download: 'Скачать'
  },
  en: {
    best: 'Best available',
    files: 'files',
    auto: 'Auto',
    afterCheck: 'After check',
    video: 'Video (MP4)',
    audio: 'Audio (MP3)',
    quality: 'Quality',
    audioFormat: 'Audio format',
    size: 'Size',
    noFolder: 'No folder selected',
    choose: 'Browse',
    download: 'Download'
  }
};

function qualityLabel(quality, text) {
  if (quality.value === 'best') return text.best;
  return quality.label;
}

export function SettingsPanel({ preview, settings, onChange, onDownload, onSelectFolder, language = 'ru' }) {
  const text = copy[language] || copy.ru;

  function update(patch) {
    onChange((current) => ({ ...current, ...patch }));
  }

  async function chooseFolder() {
    const folder = await onSelectFolder();
    if (folder) update({ folder });
  }

  const qualities = preview?.qualities?.length
    ? preview.qualities
    : [{ value: 'best', label: text.best }];

  const approxSize = preview?.type === 'playlist'
    ? `${preview.itemCount || 0} ${text.files}`
    : settings.mode === 'audio'
      ? text.auto
      : text.afterCheck;

  return (
    <section className="settings-panel">
      <div className="segmented">
        <button
          type="button"
          className={`segment ${settings.mode === 'video' ? 'active' : ''}`}
          onClick={() => update({ mode: 'video' })}
        >
          <Video size={16} /> {text.video}
        </button>
        <button
          type="button"
          className={`segment ${settings.mode === 'audio' ? 'active' : ''}`}
          onClick={() => update({ mode: 'audio' })}
        >
          <Music size={16} /> {text.audio}
        </button>
      </div>

      <div className="settings-grid">
        <div className="field quality-field">
          <label htmlFor="quality">{settings.mode === 'video' ? text.quality : text.audioFormat}</label>
          {settings.mode === 'video' ? (
            <select id="quality" value={settings.quality} onChange={(event) => update({ quality: event.target.value })}>
              {qualities.map((quality) => (
                <option key={quality.value} value={quality.value}>
                  {qualityLabel(quality, text)}
                </option>
              ))}
            </select>
          ) : (
            <select
              id="quality"
              value={settings.audioFormat}
              onChange={(event) => update({ audioFormat: event.target.value })}
            >
              <option value="mp3">MP3</option>
              <option value="m4a">M4A</option>
            </select>
          )}
        </div>

        <div className="size-readout">
          <span>{text.size}</span>
          <strong>{approxSize}</strong>
        </div>
      </div>

      <div className="folder-row">
        <div className="folder-value" title={settings.folder || text.noFolder}>
          {settings.folder || text.noFolder}
        </div>
        <button type="button" className="secondary-button" onClick={chooseFolder}>
          <FolderOpen size={17} />
          {text.choose}
        </button>
      </div>

      <button className="primary-button wide" type="button" onClick={onDownload} disabled={!preview}>
        <Download size={17} />
        {text.download}
      </button>
    </section>
  );
}
