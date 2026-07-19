export function parseYouTubeUrl(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, '');
    const allowedHosts = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);
    if (!allowedHosts.has(host)) return null;

    const playlistId = url.searchParams.get('list');
    if (playlistId) return { type: 'playlist', id: playlistId };

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? { type: 'video', id } : null;
    }

    const videoId = url.searchParams.get('v');
    return videoId ? { type: 'video', id: videoId } : null;
  } catch {
    return null;
  }
}
