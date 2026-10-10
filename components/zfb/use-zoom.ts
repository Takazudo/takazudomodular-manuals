'use client';

import { getScope, signal, type Signal } from '@takazudo/zfb/zudo-react';
import { DEFAULT_ZOOM_ENABLED, readPersistedZoom, writeZoomToStorage } from './zoom';

/** Browser preferences never alter the initial SSR/hydration description. */
export function useZoom(): [Signal<boolean>, () => void] {
  const enabled = signal(DEFAULT_ZOOM_ENABLED);
  getScope().onActivate(() => {
    enabled.value = readPersistedZoom();
  });
  const toggle = () => {
    enabled.value = !enabled.value;
    writeZoomToStorage(enabled.value);
  };
  return [enabled, toggle];
}
