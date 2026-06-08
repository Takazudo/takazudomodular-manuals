'use client';

import { useCallback, useEffect, useState } from 'preact/hooks';
import { DEFAULT_ZOOM_ENABLED, readPersistedZoom, writeZoomToStorage } from './zoom';

/**
 * Shared zoom-enabled state hook owned by the mega-island (ManualApp).
 *
 * SSR-safe: state initializes to DEFAULT_ZOOM_ENABLED (false) on first render so
 * SSR and hydration always agree. The real persisted preference is read from
 * localStorage in a useEffect, avoiding hydration mismatches.
 *
 * Returns [enabled, toggle] — `toggle` flips the flag and persists it.
 */
export function useZoom(): [boolean, () => void] {
  const [enabled, setEnabled] = useState<boolean>(DEFAULT_ZOOM_ENABLED);

  useEffect(() => {
    const persisted = readPersistedZoom();
    if (persisted !== DEFAULT_ZOOM_ENABLED) {
      setEnabled(persisted);
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      writeZoomToStorage(next);
      return next;
    });
  }, []);

  return [enabled, toggle];
}
