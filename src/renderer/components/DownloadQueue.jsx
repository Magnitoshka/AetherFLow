import { ChevronDown, ChevronRight, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

const copy = {
  ru: {
    statuses: {
      queued: 'В очереди',
      downloading: 'Загрузка',
      completed: 'Готово',
      failed: 'Ошибка',
      canceled: 'Отменено'
    },
    phases: {
      queued: 'ожидает',
      fetching: 'подготовка',
      downloading: 'скачивание',
      merging: 'объединение',
      converting: 'конвертация',
      completed: 'готово',
      failed: 'ошибка',
      canceled: 'отменено'
    },
    taskZero: '0 задач',
    taskOne: 'задача',
    taskFew: 'задачи',
    taskMany: 'задач',
    remaining: 'осталось',
    progress: 'Прогресс',
    percent: 'процентов',
    retry: 'Повторить',
    cancel: 'Отменить',
    playlist: 'Плейлист',
    queue: 'Очередь',
    empty: 'Загрузки появятся здесь после нажатия “Скачать”.',
    cancelAll: 'Отменить все'
  },
  en: {
    statuses: {
      queued: 'Queued',
      downloading: 'Downloading',
      completed: 'Done',
      failed: 'Error',
      canceled: 'Canceled'
    },
    phases: {
      queued: 'waiting',
      fetching: 'preparing',
      downloading: 'downloading',
      merging: 'merging',
      converting: 'converting',
      completed: 'done',
      failed: 'error',
      canceled: 'canceled'
    },
    taskZero: '0 tasks',
    taskOne: 'task',
    taskFew: 'tasks',
    taskMany: 'tasks',
    remaining: 'left',
    progress: 'Progress',
    percent: 'percent',
    retry: 'Retry',
    cancel: 'Cancel',
    playlist: 'Playlist',
    queue: 'Queue',
    empty: 'Downloads will appear here after pressing “Download”.',
    cancelAll: 'Cancel all'
  }
};

function fileCountLabel(count, text, language) {
  if (!count) return text.taskZero;
  if (language === 'en') return `${count} ${count === 1 ? text.taskOne : text.taskMany}`;
  const last = count % 10;
  const lastTwo = count % 100;
  if (last === 1 && lastTwo !== 11) return `${count} ${text.taskOne}`;
  if ([2, 3, 4].includes(last) && ![12, 13, 14].includes(lastTwo)) return `${count} ${text.taskFew}`;
  return `${count} ${text.taskMany}`;
}

function QueueItem({ item, onCancel, onRetry, dense = false, text }) {
  const progress = Math.max(0, Math.min(100, item.progress || 0));
  const subtitle = [
    text.statuses[item.status] || item.status,
    text.phases[item.phase] || item.phase,
    item.speed,
    item.eta ? `${text.remaining} ${item.eta}` : '',
    item.total
  ].filter(Boolean).join(' · ');

  return (
    <article className={`queue-item ${dense ? 'dense' : ''}`}>
      <div className="queue-thumb" />
      <div className="queue-info">
        <div className="queue-title" title={item.title}>{item.title}</div>
        <div className="queue-subtitle">{subtitle}</div>
        {item.error && <div className="queue-error">{item.error}</div>}
        <div className="progress" aria-label={`${text.progress} ${Math.round(progress)} ${text.percent}`}>
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="queue-side">
        <span>{Math.round(progress)}%</span>
        {item.status === 'failed' && (
          <button className="mini-button" type="button" onClick={() => onRetry(item.id)} title={text.retry}>
            <RotateCcw size={13} />
          </button>
        )}
        {['queued', 'downloading'].includes(item.status) && (
          <button className="mini-button danger" type="button" onClick={() => onCancel(item.id)} title={text.cancel}>
            <X size={13} />
          </button>
        )}
      </div>
    </article>
  );
}

export function DownloadQueue({ items, onCancel, onCancelAll, onRetry, language = 'ru' }) {
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const text = copy[language] || copy.ru;
  const hasCancelable = items.some((item) => ['queued', 'downloading'].includes(item.status));
  const groups = [];
  const playlistGroups = new Map();

  items.forEach((item) => {
    if (!item.playlistId) {
      groups.push({ type: 'single', item });
      return;
    }

    if (!playlistGroups.has(item.playlistId)) {
      const group = {
        type: 'playlist',
        id: item.playlistId,
        title: item.playlistTitle || text.playlist,
        items: []
      };
      playlistGroups.set(item.playlistId, group);
      groups.push(group);
    }
    playlistGroups.get(item.playlistId).items.push(item);
  });

  return (
    <section className="queue-panel">
      <div className="rail-header">
        <h2>{text.queue}</h2>
        <span>{fileCountLabel(items.length, text, language)}</span>
      </div>

      {!items.length && <div className="rail-empty">{text.empty}</div>}

      <div className="queue-list">
        {groups.map((group) => {
          if (group.type === 'single') {
            return <QueueItem key={group.item.id} item={group.item} onCancel={onCancel} onRetry={onRetry} text={text} />;
          }

          const collapsed = collapsedGroups[group.id];
          const avgProgress = group.items.reduce((sum, item) => sum + (item.progress || 0), 0) / group.items.length;

          return (
            <div className="queue-group" key={group.id}>
              <button
                className="queue-group-header"
                type="button"
                onClick={() => setCollapsedGroups((current) => ({ ...current, [group.id]: !current[group.id] }))}
              >
                {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                <span>{group.title}</span>
                <small>{Math.round(avgProgress)}%</small>
              </button>
              {!collapsed && group.items.map((item) => (
                <QueueItem key={item.id} item={item} onCancel={onCancel} onRetry={onRetry} dense text={text} />
              ))}
            </div>
          );
        })}
      </div>

      {hasCancelable && (
        <button className="cancel-all" type="button" onClick={onCancelAll}>
          {text.cancelAll}
        </button>
      )}
    </section>
  );
}
