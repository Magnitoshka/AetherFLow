import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildFormatSelector, getAvailableQualities } from '../src/main/services/formatMapper.js';

describe('buildFormatSelector', () => {
  it('uses best video and audio for best MP4', () => {
    assert.equal(buildFormatSelector({ mode: 'video', quality: 'best' }), 'bv*+ba/b');
  });

  it('caps video height', () => {
    assert.equal(buildFormatSelector({ mode: 'video', quality: '720' }), 'bv*[height<=720]+ba/b[height<=720]');
  });

  it('uses audio selector for audio mode', () => {
    assert.equal(buildFormatSelector({ mode: 'audio', audioFormat: 'mp3' }), 'ba/b');
  });
});

describe('getAvailableQualities', () => {
  it('returns best plus matching heights', () => {
    assert.deepEqual(
      getAvailableQualities([
        { height: 1080, vcodec: 'avc1' },
        { height: 720, vcodec: 'avc1' },
        { height: 720, vcodec: 'none' }
      ]),
      [
        { value: 'best', label: 'Лучшее доступное' },
        { value: '1080', label: '1080p' },
        { value: '720', label: '720p' }
      ]
    );
  });
});
