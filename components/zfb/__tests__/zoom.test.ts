/**
 * Unit tests for components/zfb/zoom.ts — pure hover-zoom helpers.
 *
 * Mirrors lang.test.ts: covers persistence (localStorage round-trip + default
 * fallback) and the clamp helper used by the magnifier math. The hover
 * interaction itself (lens/panel geometry) requires the island + a real
 * pointer and is validated by e2e/UI verification.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_ZOOM_ENABLED,
  ZOOM_MAX_FACTOR,
  ZOOM_MIN_FACTOR,
  ZOOM_STORAGE_KEY,
  clamp,
  readPersistedZoom,
  writeZoomToStorage,
} from '../zoom';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('readPersistedZoom()', () => {
  it('returns false (DEFAULT_ZOOM_ENABLED) when nothing is stored', () => {
    expect(readPersistedZoom()).toBe(DEFAULT_ZOOM_ENABLED);
    expect(readPersistedZoom()).toBe(false);
  });

  it('returns true only for the exact stored "1" flag', () => {
    window.localStorage.setItem(ZOOM_STORAGE_KEY, '1');
    expect(readPersistedZoom()).toBe(true);
  });

  it('treats "0" and any other value as disabled', () => {
    window.localStorage.setItem(ZOOM_STORAGE_KEY, '0');
    expect(readPersistedZoom()).toBe(false);
    window.localStorage.setItem(ZOOM_STORAGE_KEY, 'yes');
    expect(readPersistedZoom()).toBe(false);
  });
});

describe('writeZoomToStorage()', () => {
  it('persists the enabled flag as "1"/"0" and round-trips through readPersistedZoom', () => {
    writeZoomToStorage(true);
    expect(window.localStorage.getItem(ZOOM_STORAGE_KEY)).toBe('1');
    expect(readPersistedZoom()).toBe(true);

    writeZoomToStorage(false);
    expect(window.localStorage.getItem(ZOOM_STORAGE_KEY)).toBe('0');
    expect(readPersistedZoom()).toBe(false);
  });
});

describe('clamp()', () => {
  it('returns the value when within range', () => {
    expect(clamp(3, ZOOM_MIN_FACTOR, ZOOM_MAX_FACTOR)).toBe(3);
  });

  it('clamps below the minimum and above the maximum', () => {
    expect(clamp(1, ZOOM_MIN_FACTOR, ZOOM_MAX_FACTOR)).toBe(ZOOM_MIN_FACTOR);
    expect(clamp(99, ZOOM_MIN_FACTOR, ZOOM_MAX_FACTOR)).toBe(ZOOM_MAX_FACTOR);
  });

  it('returns the bounds at the edges', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
