/**
 * Canonical base path for the zfb site — matches `base` in `zfb.config.ts`.
 * Stored with a trailing slash (the form zfb.config expects).
 *
 * This module has zero imports so it is safe to bundle into client islands
 * (routing.ts) AND import from the build config (zfb.config.ts) without
 * pulling node-only deps into the browser bundle.
 */
export const ZFB_BASE = '/manuals/';
