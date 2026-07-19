import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseProgressLine } from '../src/main/services/progressParser.js';

describe('parseProgressLine', () => {
  it('parses yt-dlp download progress', () => {
    assert.deepEqual(parseProgressLine('[download]  42.3% of 50.00MiB at 8.40MiB/s ETA 00:18'), {
      phase: 'downloading',
      percent: 42.3,
      total: '50.00MiB',
      speed: '8.40MiB/s',
      eta: '00:18'
    });
  });

  it('detects merging phase', () => {
    assert.deepEqual(parseProgressLine('[Merger] Merging formats into "video.mp4"'), { phase: 'merging' });
  });

  it('ignores unrelated output', () => {
    assert.equal(parseProgressLine('[youtube] Extracting URL'), null);
  });
});
