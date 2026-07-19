import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseYouTubeUrl } from '../src/main/services/url.js';

describe('parseYouTubeUrl', () => {
  it('accepts a video URL', () => {
    assert.deepEqual(parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), {
      type: 'video',
      id: 'dQw4w9WgXcQ'
    });
  });

  it('accepts a short video URL', () => {
    assert.deepEqual(parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'), {
      type: 'video',
      id: 'dQw4w9WgXcQ'
    });
  });

  it('accepts a playlist URL', () => {
    assert.deepEqual(parseYouTubeUrl('https://www.youtube.com/playlist?list=PL123456789'), {
      type: 'playlist',
      id: 'PL123456789'
    });
  });

  it('rejects non-YouTube URLs', () => {
    assert.equal(parseYouTubeUrl('https://example.com'), null);
  });
});
