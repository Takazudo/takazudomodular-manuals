import { describe, it, expect } from 'vitest';
import { withBasePath } from './asset-url';

describe('withBasePath', () => {
  it('passes through external HTTP URL unchanged', () => {
    expect(withBasePath('http://example.com/image.png')).toBe('http://example.com/image.png');
  });

  it('passes through external HTTPS URL unchanged', () => {
    expect(withBasePath('https://cdn.example.com/assets/img.jpg')).toBe(
      'https://cdn.example.com/assets/img.jpg',
    );
  });

  it('passes through already-prefixed /manuals/ URL', () => {
    expect(withBasePath('/manuals/oxi-one-mk2/pages/page-001.png')).toBe(
      '/manuals/oxi-one-mk2/pages/page-001.png',
    );
  });

  it('adds /manuals prefix to absolute path', () => {
    expect(withBasePath('/oxi-one-mk2/pages/page-001.png')).toBe(
      '/manuals/oxi-one-mk2/pages/page-001.png',
    );
  });

  it('normalizes and prefixes relative path (no leading slash)', () => {
    expect(withBasePath('oxi-one-mk2/pages/page-001.png')).toBe(
      '/manuals/oxi-one-mk2/pages/page-001.png',
    );
  });

  it('handles root path /', () => {
    expect(withBasePath('/')).toBe('/manuals/');
  });
});
