import { describe, it, expect } from 'vitest';
import { getThumbImage } from './manual';
import type { ManualPage } from './manual';

describe('getThumbImage', () => {
  it('converts page image path to thumb path for oxi-one-mk2', () => {
    const page = { image: '/oxi-one-mk2/pages/page-001.png' } as ManualPage;
    expect(getThumbImage(page)).toBe('/oxi-one-mk2/thumbs/thumb-001.png');
  });

  it('converts page image path to thumb path for addac112', () => {
    const page = { image: '/addac112/pages/page-042.png' } as ManualPage;
    expect(getThumbImage(page)).toBe('/addac112/thumbs/thumb-042.png');
  });
});
