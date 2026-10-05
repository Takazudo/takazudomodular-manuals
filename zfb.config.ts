// This site is deployed as a Cloudflare Worker at manuals.takazudomodular.com.
// `base` is controlled by lib/base-path.ts (ZFB_BASE); S1 sets it to `/`.
// `site` is used by layouts for canonical <link> and OpenGraph meta.
// The base value is shared with `components/zfb/routing.ts` via
// `lib/base-path.ts` to keep the two in sync without importing this config
// (which may pull build-only deps) into client islands.

import { defineConfig } from '@takazudo/zfb/config';
import { ZFB_BASE } from './lib/base-path.js';

export default defineConfig({
  base: ZFB_BASE,
  outDir: 'dist',
  publicDir: 'public',
  // Preserve the root app token scale and the previous authored-CSS cascade.
  wind: {
    spec: 1,
    reset: 'owned-v1',
    strict: true,
    utilities: {
      placement: 'before-authored',
    },
    defaultTransitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    tokens: {
      colors: {
        'zd-black': 'var(--zd-color-black)',
        'zd-white': 'var(--zd-color-white)',
        'zd-gray': 'var(--zd-color-gray)',
        'zd-gray2': 'var(--zd-color-gray2)',
        'zd-gray3': 'var(--zd-color-gray3)',
        'zd-gray4': 'var(--zd-color-gray4)',
        'zd-gray5': 'var(--zd-color-gray5)',
        'zd-gray6': 'var(--zd-color-gray6)',
        'zd-gray7': 'var(--zd-color-gray7)',
        'zd-overlay': 'var(--zd-color-overlay)',
        'zd-link': 'var(--zd-color-link)',
        'zd-active': 'var(--zd-color-active)',
        'zd-outline': 'var(--zd-color-outline)',
        'zd-strong': 'var(--zd-color-strong)',
        'zd-sold': 'var(--zd-color-sold)',
        'zd-notify': 'var(--zd-color-notify)',
        'zd-error': 'var(--zd-color-error)',
        debug: 'var(--zd-color-debug)',
        'zd-price': 'var(--zd-color-price)',
        'zd-mercari-corporate': 'var(--zd-color-mercari-corporate)',
        black: '#000',
        white: '#fff',
      },
      spacing: {
        '1px': 'var(--zd-spacing-1px)',
        'hgap-2xs': 'var(--zd-spacing-hgap-2xs)',
        'hgap-xs': 'var(--zd-spacing-hgap-xs)',
        'hgap-sm': 'var(--zd-spacing-hgap-sm)',
        'hgap-md': 'var(--zd-spacing-hgap-md)',
        'hgap-md-x2': 'var(--zd-spacing-hgap-md-x2)',
        'hgap-lg': 'var(--zd-spacing-hgap-lg)',
        'hgap-lg-x2': 'var(--zd-spacing-hgap-lg-x2)',
        'hgap-xl': 'var(--zd-spacing-hgap-xl)',
        'hgap-2xl': 'var(--zd-spacing-hgap-2xl)',
        'vgap-2xs': 'var(--zd-spacing-vgap-2xs)',
        'vgap-xs': 'var(--zd-spacing-vgap-xs)',
        'vgap-sm': 'var(--zd-spacing-vgap-sm)',
        'vgap-md': 'var(--zd-spacing-vgap-md)',
        'vgap-lg': 'var(--zd-spacing-vgap-lg)',
        'vgap-xl': 'var(--zd-spacing-vgap-xl)',
        'vgap-2xl': 'var(--zd-spacing-vgap-2xl)',
      },
      fontSizes: {
        xs: {
          size: 'var(--zd-font-xs-size)',
          lineHeight: 'var(--zd-font-xs-lineHeight)',
        },
        sm: {
          size: 'var(--zd-font-sm-size)',
          lineHeight: 'var(--zd-font-sm-lineHeight)',
        },
        base: {
          size: 'var(--zd-font-base-size)',
          lineHeight: 'var(--zd-font-base-lineHeight)',
        },
        lg: {
          size: 'var(--zd-font-lg-size)',
          lineHeight: 'var(--zd-font-lg-lineHeight)',
        },
        xl: {
          size: 'var(--zd-font-xl-size)',
          lineHeight: 'var(--zd-font-xl-lineHeight)',
        },
        '2xl': {
          size: 'var(--zd-font-2xl-size)',
          lineHeight: 'var(--zd-font-2xl-lineHeight)',
        },
        '3xl': {
          size: 'var(--zd-font-3xl-size)',
          lineHeight: 'var(--zd-font-3xl-lineHeight)',
        },
        '4xl': {
          size: 'var(--zd-font-4xl-size)',
          lineHeight: 'var(--zd-font-4xl-lineHeight)',
        },
        '5xl': {
          size: 'var(--zd-font-5xl-size)',
          lineHeight: 'var(--zd-font-5xl-lineHeight)',
        },
      },
      fontFamilies: {
        noto: "'Noto Sans', 'Noto Sans JP', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Hiragino Kaku Gothic Pro', 'Yu Gothic', Meiryo, sans-serif",
        futura:
          "Futura, Jost, 'Century Gothic', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', 'Noto Sans JP', 'Hiragino Sans', sans-serif",
        sans: "Helvetica, Arial, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic Pro', 'Yu Gothic', Meiryo, sans-serif",
        mono: "Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      },
      fontWeights: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      lineHeights: {
        none: 'var(--zd-lineHeight-none)',
        tight: 'var(--zd-lineHeight-tight)',
        snug: 'var(--zd-lineHeight-snug)',
        normal: 'var(--zd-lineHeight-normal)',
        relaxed: 'var(--zd-lineHeight-relaxed)',
        loose: 'var(--zd-lineHeight-loose)',
      },
      radii: {
        default: '0.25rem',
        xs: '0.125rem',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
      },
      shadows: {
        default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },
    },
    breakpoints: {
      sm: {
        minWidthPx: 580,
      },
      md: {
        minWidthPx: 740,
      },
      lg: {
        minWidthPx: 980,
      },
      xl: {
        minWidthPx: 1280,
      },
      '2xl': {
        minWidthPx: 1630,
      },
      '3xl': {
        minWidthPx: 1800,
      },
    },
    authoredClasses: {
      'text-shadow-md': true,
      'text-shadow-none': true,
    },
  },
  site: 'https://manuals.takazudomodular.com',
  // Port 3300 avoids collision with Next.js (3100) and serve (8030).
  port: 3300,
  // No `collections`: we keep the JSON data model + lib/zfb-registry.ts
  // (code-generated from public/*/data via scripts/gen-registry.js).
  // Content collections can be added later if needed.
  adapter: '@takazudo/zfb-adapter-cloudflare',
});
