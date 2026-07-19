const COMMON_QUALITIES = ['best', '2160', '1440', '1080', '720', '480', '360'];

export function buildFormatSelector(options) {
  if (options.mode === 'audio') return 'ba/b';
  if (options.quality === 'best') return 'bv*+ba/b';
  return `bv*[height<=${options.quality}]+ba/b[height<=${options.quality}]`;
}

export function getAvailableQualities(formats = []) {
  const heights = new Set(
    formats
      .filter((format) => format.vcodec && format.vcodec !== 'none' && Number.isFinite(format.height))
      .map((format) => String(format.height))
  );

  const options = COMMON_QUALITIES.filter((quality) => quality === 'best' || heights.has(quality)).map((quality) => ({
    value: quality,
    label: quality === 'best' ? 'Лучшее доступное' : `${quality}p`
  }));

  return options.length ? options : [{ value: 'best', label: 'Лучшее доступное' }];
}
