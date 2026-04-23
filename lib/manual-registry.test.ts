import { describe, it, expect } from 'vitest';

import {
  getAvailableLanguages,
  getAvailableManuals,
  getManifest,
  getPagesData,
  hasLanguage,
  isValidManual,
} from './manual-registry';

// These tests exercise the real registry (no mocks). They rely on the
// concrete set of JSON files checked into the repo, so assertions are kept
// tolerant: they lock down invariants, not specific line counts.

describe('manual-registry', () => {
  describe('getAvailableManuals', () => {
    it('returns a sorted list containing known manuals', () => {
      const manuals = getAvailableManuals();
      expect(manuals.length).toBeGreaterThan(0);
      expect(manuals).toContain('oxi-one-mk2');
      expect(manuals).toContain('oxi-coral');
      const sorted = [...manuals].sort();
      expect(manuals).toEqual(sorted);
    });
  });

  describe('isValidManual', () => {
    it('returns true for known manuals', () => {
      expect(isValidManual('oxi-one-mk2')).toBe(true);
      expect(isValidManual('oxi-coral')).toBe(true);
    });

    it('returns false for unknown manuals', () => {
      expect(isValidManual('nope-not-a-manual')).toBe(false);
    });
  });

  describe('hasLanguage', () => {
    it('returns true for JA on any registered manual', () => {
      expect(hasLanguage('oxi-one-mk2', 'ja')).toBe(true);
      expect(hasLanguage('oxi-coral', 'ja')).toBe(true);
    });

    it('returns true for EN when a manual has pages-en.json', () => {
      // oxi-coral is known to ship with pages-en.json
      expect(hasLanguage('oxi-coral', 'en')).toBe(true);
    });

    // Note: every currently shipped manual has both JA and EN (issue #97
    // backfilled the last 7). The EN-absent fallback logic is still in place
    // and will be exercised again as soon as a JA-only manual ships; a
    // mock-based test for the UI-facing disabled state lives with the toggle
    // component (see sub-issue #102).

    it('returns false for unknown manuals', () => {
      expect(hasLanguage('nope-not-a-manual', 'ja')).toBe(false);
      expect(hasLanguage('nope-not-a-manual', 'en')).toBe(false);
    });
  });

  describe('getAvailableLanguages', () => {
    it('includes JA for every registered manual', () => {
      for (const id of getAvailableManuals()) {
        expect(getAvailableLanguages(id)).toContain('ja');
      }
    });

    it('lists JA first, then EN when available', () => {
      const langs = getAvailableLanguages('oxi-coral');
      expect(langs).toEqual(['ja', 'en']);
    });

    it('returns an empty array for unknown manuals', () => {
      expect(getAvailableLanguages('nope-not-a-manual')).toEqual([]);
    });
  });

  describe('getPagesData', () => {
    it('returns JA by default (backwards-compatible)', () => {
      const data = getPagesData('oxi-one-mk2');
      expect(data.metadata.language).toBe('ja');
    });

    it('returns JA when lang is "ja"', () => {
      const data = getPagesData('oxi-coral', 'ja');
      expect(data.metadata.language).toBe('ja');
    });

    it('returns EN when lang is "en" and EN is available', () => {
      const data = getPagesData('oxi-coral', 'en');
      expect(data.metadata.language).toBe('en');
    });

    // JA fallback for EN-absent manuals is defensively implemented in
    // getPagesData; with every currently shipped manual carrying EN there
    // is no real fixture to exercise it. UI-level mock tests in sub-issue
    // #102 cover the disabled-toggle path that relies on this behaviour.

    it('throws for unknown manual IDs', () => {
      expect(() => getPagesData('nope-not-a-manual')).toThrow(/Manual not found/);
      expect(() => getPagesData('nope-not-a-manual', 'en')).toThrow(/Manual not found/);
    });
  });

  describe('getManifest', () => {
    it('returns a manifest with a title for known manuals', () => {
      const manifest = getManifest('oxi-one-mk2');
      expect(typeof manifest.title).toBe('string');
      expect(manifest.totalPages).toBeGreaterThan(0);
    });

    it('throws for unknown manuals', () => {
      expect(() => getManifest('nope-not-a-manual')).toThrow(/Manual not found/);
    });
  });
});
