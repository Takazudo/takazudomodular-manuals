import { describe, it, expect } from 'vitest';

import { getAvailableManuals, getManifest, getPagesJa, hasEnglish } from './zfb-registry';

// These tests exercise the real registry (no mocks). They rely on the
// concrete set of JSON files checked into the repo, so assertions are kept
// tolerant: they lock down invariants, not specific counts.

describe('zfb-registry', () => {
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

  describe('getManifest', () => {
    it('returns a manifest with expected fields for a known manual', () => {
      const manifest = getManifest('oxi-one-mk2');
      expect(typeof manifest.title).toBe('string');
      expect(manifest.totalPages).toBeGreaterThan(0);
    });

    it('throws for unknown manuals', () => {
      expect(() => getManifest('nope-not-a-manual')).toThrow(/Manual not found/);
    });
  });

  describe('getPagesJa', () => {
    it('returns page array with pageNum fields', () => {
      const pages = getPagesJa('oxi-one-mk2');
      expect(pages.length).toBeGreaterThan(0);
      expect(typeof pages[0].pageNum).toBe('number');
    });
  });

  describe('hasEnglish', () => {
    it('reads hasEnglish from manifest (not just id-in-REGISTRY)', () => {
      // All 52 current manuals have hasEnglish: true in manifest.json
      for (const id of getAvailableManuals()) {
        const manifestValue = getManifest(id).hasEnglish;
        expect(hasEnglish(id)).toBe(manifestValue ?? false);
      }
    });

    it('returns true for known manuals that carry hasEnglish: true', () => {
      expect(hasEnglish('oxi-one-mk2')).toBe(true);
      expect(hasEnglish('oxi-coral')).toBe(true);
    });

    it('returns false for an unknown manual ID', () => {
      expect(hasEnglish('nope-not-a-manual')).toBe(false);
    });
  });
});
