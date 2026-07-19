import { ClipboardPaste, Search } from 'lucide-react';

const copy = {
  ru: {
    placeholder: 'https://www.youtube.com/watch?v=...',
    aria: 'Ссылка YouTube',
    paste: 'Вставить из буфера',
    checking: 'Проверка...',
    check: 'Проверить'
  },
  en: {
    placeholder: 'https://www.youtube.com/watch?v=...',
    aria: 'YouTube link',
    paste: 'Paste from clipboard',
    checking: 'Checking...',
    check: 'Check'
  }
};

export function UrlBar({ url, onUrlChange, onInspect, isInspecting, inputId = 'youtube-url', language = 'ru' }) {
  const text = copy[language] || copy.ru;

  async function pasteFromClipboard() {
    const clipboardText = await navigator.clipboard.readText();
    if (clipboardText) onUrlChange(clipboardText);
  }

  function submit(event) {
    event.preventDefault();
    onInspect();
  }

  return (
    <form className="url-bar" onSubmit={submit}>
      <input
        id={inputId}
        className="url-input"
        value={url}
        onChange={(event) => onUrlChange(event.target.value)}
        placeholder={text.placeholder}
        aria-label={text.aria}
      />
      <button className="icon-button" type="button" onClick={pasteFromClipboard} title={text.paste}>
        <ClipboardPaste size={17} />
      </button>
      <button className="primary-button paste-button" type="submit" disabled={!url.trim() || isInspecting}>
        <Search size={18} />
        {isInspecting ? text.checking : text.check}
      </button>
    </form>
  );
}
