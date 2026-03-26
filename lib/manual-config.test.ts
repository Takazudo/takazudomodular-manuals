import { describe, it, expect } from 'vitest';
import {
  getManualBasePath,
  getPagePath,
  getManualAssetPath,
  getManualDataPath,
  getManualPagesPath,
  getManualProcessingPath,
  getPagesDataPath,
} from './manual-config';

describe('manual-config', () => {
  describe('getManualBasePath', () => {
    it('returns base path for manual', () => {
      expect(getManualBasePath('oxi-one-mk2')).toBe('/oxi-one-mk2');
    });
  });

  describe('getPagePath', () => {
    it('returns page path for manual and page number', () => {
      expect(getPagePath('oxi-one-mk2', 5)).toBe('/oxi-one-mk2/page/5');
    });
  });

  describe('getManualAssetPath', () => {
    it('returns asset path for manual and filename', () => {
      expect(getManualAssetPath('oxi-one-mk2', 'pages/page-001.png')).toBe(
        '/oxi-one-mk2/pages/page-001.png',
      );
    });
  });

  describe('getManualDataPath', () => {
    it('returns data directory path', () => {
      expect(getManualDataPath('oxi-one-mk2')).toBe('/public/oxi-one-mk2/data');
    });
  });

  describe('getManualPagesPath', () => {
    it('returns pages directory path', () => {
      expect(getManualPagesPath('oxi-one-mk2')).toBe('/public/oxi-one-mk2/pages');
    });
  });

  describe('getManualProcessingPath', () => {
    it('returns processing directory path', () => {
      expect(getManualProcessingPath('oxi-one-mk2')).toBe('/public/oxi-one-mk2/processing');
    });
  });

  describe('getPagesDataPath', () => {
    it('returns pages.json file path', () => {
      expect(getPagesDataPath('oxi-one-mk2')).toBe('/public/oxi-one-mk2/data/pages.json');
    });
  });
});
