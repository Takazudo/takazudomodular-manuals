/**
 * Manual Registry
 *
 * Central registry for all manuals with explicit imports.
 * Required for Next.js static export - no dynamic require() allowed.
 */

import type { ManualManifest, ManualPagesData } from './types/manual';

// Import oxi-one-mk2
import oxiOneMk2Manifest from '@/public/oxi-one-mk2/data/manifest.json';
import oxiOneMk2Pages from '@/public/oxi-one-mk2/data/pages.json';

// Import oxi-coral
import oxiCoralManifest from '@/public/oxi-coral/data/manifest.json';
import oxiCoralPages from '@/public/oxi-coral/data/pages.json';

// Import oxi-e16-quick-start
import oxiE16QuickStartManifest from '@/public/oxi-e16-quick-start/data/manifest.json';
import oxiE16QuickStartPages from '@/public/oxi-e16-quick-start/data/pages.json';

// Import oxi-e16-manual
import oxiE16ManualManifest from '@/public/oxi-e16-manual/data/manifest.json';
import oxiE16ManualPages from '@/public/oxi-e16-manual/data/pages.json';

// Import addac112-looper
import addac112LooperManifest from '@/public/addac112-looper/data/manifest.json';
import addac112LooperPages from '@/public/addac112-looper/data/pages.json';

// Import addac107-acids
import addac107AcidsManifest from '@/public/addac107-acids/data/manifest.json';
import addac107AcidsPages from '@/public/addac107-acids/data/pages.json';

// Import addac106-tnoise
import addac106TnoiseManifest from '@/public/addac106-tnoise/data/manifest.json';
import addac106TnoisePages from '@/public/addac106-tnoise/data/pages.json';

export interface ManualRegistryEntry {
  manifest: ManualManifest;
  pages: ManualPagesData;
}

/**
 * Global registry of all available manuals
 * To add a new manual:
 * 1. Import manifest and pages
 * 2. Add entry to MANUAL_REGISTRY
 */
const MANUAL_REGISTRY: Record<string, ManualRegistryEntry> = {
  'oxi-one-mk2': {
    manifest: oxiOneMk2Manifest as unknown as ManualManifest,
    pages: oxiOneMk2Pages as unknown as ManualPagesData,
  },
  'oxi-coral': {
    manifest: oxiCoralManifest as unknown as ManualManifest,
    pages: oxiCoralPages as unknown as ManualPagesData,
  },
  'oxi-e16-quick-start': {
    manifest: oxiE16QuickStartManifest as unknown as ManualManifest,
    pages: oxiE16QuickStartPages as unknown as ManualPagesData,
  },
  'oxi-e16-manual': {
    manifest: oxiE16ManualManifest as unknown as ManualManifest,
    pages: oxiE16ManualPages as unknown as ManualPagesData,
  },
  'addac112-looper': {
    manifest: addac112LooperManifest as unknown as ManualManifest,
    pages: addac112LooperPages as unknown as ManualPagesData,
  },
  'addac107-acids': {
    manifest: addac107AcidsManifest as unknown as ManualManifest,
    pages: addac107AcidsPages as unknown as ManualPagesData,
  },
  'addac106-tnoise': {
    manifest: addac106TnoiseManifest as unknown as ManualManifest,
    pages: addac106TnoisePages as unknown as ManualPagesData,
  },
};

/**
 * Get manifest for a specific manual
 */
export function getManifest(manualId: string): ManualManifest {
  const entry = MANUAL_REGISTRY[manualId];
  if (!entry) {
    throw new Error(`Manual not found: ${manualId}`);
  }
  return entry.manifest;
}

/**
 * Get pages data for a specific manual
 */
export function getPagesData(manualId: string): ManualPagesData {
  const entry = MANUAL_REGISTRY[manualId];
  if (!entry) {
    throw new Error(`Manual not found: ${manualId}`);
  }
  return entry.pages;
}

/**
 * Get list of all available manual IDs (sorted alphabetically)
 */
export function getAvailableManuals(): string[] {
  return Object.keys(MANUAL_REGISTRY).sort();
}

/**
 * Check if a manual ID is valid
 */
export function isValidManual(manualId: string): boolean {
  return manualId in MANUAL_REGISTRY;
}

/**
 * Get manual title by ID
 * Returns undefined if manual not found
 */
export function getManualTitle(manualId: string): string | undefined {
  const entry = MANUAL_REGISTRY[manualId];
  return entry?.manifest.title;
}
