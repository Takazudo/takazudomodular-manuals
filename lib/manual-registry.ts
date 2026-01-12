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

// Import addac104-tnetw
import addac104TnetwManifest from '@/public/addac104-tnetw/data/manifest.json';
import addac104TnetwPages from '@/public/addac104-tnetw/data/pages.json';

// Import addac207-quantizer
import addac207QuantizerManifest from '@/public/addac207-quantizer/data/manifest.json';
import addac207QuantizerPages from '@/public/addac207-quantizer/data/pages.json';

// Import addac714-vintclip
import addac714VintclipManifest from '@/public/addac714-vintclip/data/manifest.json';
import addac714VintclipPages from '@/public/addac714-vintclip/data/pages.json';

// Import addac713-stereomix
import addac713StereomixManifest from '@/public/addac713-stereomix/data/manifest.json';
import addac713StereomixPages from '@/public/addac713-stereomix/data/pages.json';

// Import addac712-vintpre
import addac712VintpreManifest from '@/public/addac712-vintpre/data/manifest.json';
import addac712VintprePages from '@/public/addac712-vintpre/data/pages.json';

// Import addac604-filter
import addac604FilterManifest from '@/public/addac604-filter/data/manifest.json';
import addac604FilterPages from '@/public/addac604-filter/data/pages.json';

// Import addac305-latches-diy
import addac305LatchesDiyManifest from '@/public/addac305-latches-diy/data/manifest.json';
import addac305LatchesDiyPages from '@/public/addac305-latches-diy/data/pages.json';

// Import addac304-manualgates-diy
import addac304ManualGatesDiyManifest from '@/public/addac304-manualgates-diy/data/manifest.json';
import addac304ManualGatesDiyPages from '@/public/addac304-manualgates-diy/data/pages.json';

// Import addac219out-stereo-diy
import addac219outStereoDiyManifest from '@/public/addac219out-stereo-diy/data/manifest.json';
import addac219outStereoDiyPages from '@/public/addac219out-stereo-diy/data/pages.json';

// Import addac219in-stereo-diy
import addac219inStereoDiyManifest from '@/public/addac219in-stereo-diy/data/manifest.json';
import addac219inStereoDiyPages from '@/public/addac219in-stereo-diy/data/pages.json';

// Import addac218-atten
import addac218AttenManifest from '@/public/addac218-atten/data/manifest.json';
import addac218AttenPages from '@/public/addac218-atten/data/pages.json';

// Import addac217-gate2trig
import addac217Gate2trigManifest from '@/public/addac217-gate2trig/data/manifest.json';
import addac217Gate2trigPages from '@/public/addac217-gate2trig/data/pages.json';

// Import addac216-sumdiff
import addac216SumdiffManifest from '@/public/addac216-sumdiff/data/manifest.json';
import addac216SumdiffPages from '@/public/addac216-sumdiff/data/pages.json';

// Import addac215-sh
import addac215ShManifest from '@/public/addac215-sh/data/manifest.json';
import addac215ShPages from '@/public/addac215-sh/data/pages.json';

// Import addac210-open-heart
import addac210OpenHeartManifest from '@/public/addac210-open-heart/data/manifest.json';
import addac210OpenHeartPages from '@/public/addac210-open-heart/data/pages.json';

// Import addac200pi-pedal-diy
import addac200piPedalDiyManifest from '@/public/addac200pi-pedal-diy/data/manifest.json';
import addac200piPedalDiyPages from '@/public/addac200pi-pedal-diy/data/pages.json';

// Import addac511-svgen
import addac511SvgenManifest from '@/public/addac511-svgen/data/manifest.json';
import addac511SvgenPages from '@/public/addac511-svgen/data/pages.json';

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
  'addac104-tnetw': {
    manifest: addac104TnetwManifest as unknown as ManualManifest,
    pages: addac104TnetwPages as unknown as ManualPagesData,
  },
  'addac207-quantizer': {
    manifest: addac207QuantizerManifest as unknown as ManualManifest,
    pages: addac207QuantizerPages as unknown as ManualPagesData,
  },
  'addac714-vintclip': {
    manifest: addac714VintclipManifest as unknown as ManualManifest,
    pages: addac714VintclipPages as unknown as ManualPagesData,
  },
  'addac713-stereomix': {
    manifest: addac713StereomixManifest as unknown as ManualManifest,
    pages: addac713StereomixPages as unknown as ManualPagesData,
  },
  'addac712-vintpre': {
    manifest: addac712VintpreManifest as unknown as ManualManifest,
    pages: addac712VintprePages as unknown as ManualPagesData,
  },
  'addac604-filter': {
    manifest: addac604FilterManifest as unknown as ManualManifest,
    pages: addac604FilterPages as unknown as ManualPagesData,
  },
  'addac305-latches-diy': {
    manifest: addac305LatchesDiyManifest as unknown as ManualManifest,
    pages: addac305LatchesDiyPages as unknown as ManualPagesData,
  },
  'addac304-manualgates-diy': {
    manifest: addac304ManualGatesDiyManifest as unknown as ManualManifest,
    pages: addac304ManualGatesDiyPages as unknown as ManualPagesData,
  },
  'addac219out-stereo-diy': {
    manifest: addac219outStereoDiyManifest as unknown as ManualManifest,
    pages: addac219outStereoDiyPages as unknown as ManualPagesData,
  },
  'addac219in-stereo-diy': {
    manifest: addac219inStereoDiyManifest as unknown as ManualManifest,
    pages: addac219inStereoDiyPages as unknown as ManualPagesData,
  },
  'addac218-atten': {
    manifest: addac218AttenManifest as unknown as ManualManifest,
    pages: addac218AttenPages as unknown as ManualPagesData,
  },
  'addac217-gate2trig': {
    manifest: addac217Gate2trigManifest as unknown as ManualManifest,
    pages: addac217Gate2trigPages as unknown as ManualPagesData,
  },
  'addac216-sumdiff': {
    manifest: addac216SumdiffManifest as unknown as ManualManifest,
    pages: addac216SumdiffPages as unknown as ManualPagesData,
  },
  'addac215-sh': {
    manifest: addac215ShManifest as unknown as ManualManifest,
    pages: addac215ShPages as unknown as ManualPagesData,
  },
  'addac210-open-heart': {
    manifest: addac210OpenHeartManifest as unknown as ManualManifest,
    pages: addac210OpenHeartPages as unknown as ManualPagesData,
  },
  'addac200pi-pedal-diy': {
    manifest: addac200piPedalDiyManifest as unknown as ManualManifest,
    pages: addac200piPedalDiyPages as unknown as ManualPagesData,
  },
  'addac511-svgen': {
    manifest: addac511SvgenManifest as unknown as ManualManifest,
    pages: addac511SvgenPages as unknown as ManualPagesData,
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
