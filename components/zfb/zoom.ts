// Hover-zoom (Amazon-style page magnifier) constants and persistence helpers,
// shared across the zfb mega-island. Mirrors lang.ts: the mega-island
// (manual-app.tsx) owns the enabled flag as plain useState and threads it down
// as props; persistence is localStorage-only (no URL param — the zoom toggle is
// a viewing preference, not a shareable view state like ?lang=).

/**
 * localStorage key for persisting the zoom-enabled preference. Namespaced under
 * `zmanuals:` to match the existing `zmanuals:lang` key and avoid collisions
 * with other takazudomodular apps on the same origin.
 */
export const ZOOM_STORAGE_KEY = 'zmanuals:zoom';

/** The feature ships off — the user opts in via the header toggle. */
export const DEFAULT_ZOOM_ENABLED = false;

/**
 * Magnification bounds. The effective zoom factor is the source image's
 * natural-to-displayed width ratio (so the panel shows native pixels — sharpest
 * for reading scanned manual text), clamped into this range so the lens is
 * neither uselessly large (too little zoom) nor impossibly tiny (too much).
 */
export const ZOOM_MIN_FACTOR = 2;
export const ZOOM_MAX_FACTOR = 4;

/**
 * Read the persisted zoom preference. Only safe to call client-side (inside an
 * effect) — guards against `window`/`localStorage` being unavailable during SSR.
 */
export function readPersistedZoom(): boolean {
  if (typeof window === 'undefined') return DEFAULT_ZOOM_ENABLED;
  try {
    return window.localStorage.getItem(ZOOM_STORAGE_KEY) === '1';
  } catch {
    // Private-mode / access-denied: fall through to default.
    return DEFAULT_ZOOM_ENABLED;
  }
}

export function writeZoomToStorage(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ZOOM_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Quota exceeded / private mode: persistence is best-effort.
  }
}

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
