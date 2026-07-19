export function parseProgressLine(line) {
  if (!line) return null;
  if (line.includes('[Merger]') || line.includes('Merging formats')) return { phase: 'merging' };
  if (line.includes('[ExtractAudio]') || line.includes('Destination:')) return { phase: 'converting' };
  if (line.includes('has already been downloaded')) return { phase: 'completed', percent: 100 };

  const match = line.match(/\[download\]\s+([\d.]+)%(?:\s+of\s+([^\s]+))?.*?\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/);
  if (!match) return null;

  return {
    phase: 'downloading',
    percent: Number(match[1]),
    total: match[2] || '',
    speed: match[3],
    eta: match[4]
  };
}
