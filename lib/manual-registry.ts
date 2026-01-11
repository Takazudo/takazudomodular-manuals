/**
 * Manual Registry
 *
 * Central registry for all manuals with explicit imports.
 * Required for Next.js static export - no dynamic require() allowed.
 */

import type { ManualManifest, ManualPart } from './types/manual';

// Import oxi-one-mk2 manifest
import oxiOneMk2Manifest from '@/public/oxi-one-mk2/data/manifest.json';

// Import all oxi-one-mk2 parts
import oxiOneMk2Part01 from '@/public/oxi-one-mk2/data/part-01.json';
import oxiOneMk2Part02 from '@/public/oxi-one-mk2/data/part-02.json';
import oxiOneMk2Part03 from '@/public/oxi-one-mk2/data/part-03.json';
import oxiOneMk2Part04 from '@/public/oxi-one-mk2/data/part-04.json';
import oxiOneMk2Part05 from '@/public/oxi-one-mk2/data/part-05.json';
import oxiOneMk2Part06 from '@/public/oxi-one-mk2/data/part-06.json';
import oxiOneMk2Part07 from '@/public/oxi-one-mk2/data/part-07.json';
import oxiOneMk2Part08 from '@/public/oxi-one-mk2/data/part-08.json';
import oxiOneMk2Part09 from '@/public/oxi-one-mk2/data/part-09.json';
import oxiOneMk2Part10 from '@/public/oxi-one-mk2/data/part-10.json';

// Import oxi-coral manifest
import oxiCoralManifest from '@/public/oxi-coral/data/manifest.json';

// Import all oxi-coral parts
import oxiCoralPart01 from '@/public/oxi-coral/data/part-01.json';
import oxiCoralPart02 from '@/public/oxi-coral/data/part-02.json';

// Import oxi-e16-quick-start manifest
import oxiE16QuickStartManifest from '@/public/oxi-e16-quick-start/data/manifest.json';

// Import all oxi-e16-quick-start parts
import oxiE16QuickStartPart01 from '@/public/oxi-e16-quick-start/data/part-01.json';

// Import oxi-e16-manual manifest
import oxiE16ManualManifest from '@/public/oxi-e16-manual/data/manifest.json';

// Import all oxi-e16-manual parts
import oxiE16ManualPart01 from '@/public/oxi-e16-manual/data/part-01.json';
import oxiE16ManualPart02 from '@/public/oxi-e16-manual/data/part-02.json';
import oxiE16ManualPart03 from '@/public/oxi-e16-manual/data/part-03.json';

// Import addac112-looper manifest
import addac112LooperManifest from '@/public/addac112-looper/data/manifest.json';

// Import all addac112-looper parts
import addac112LooperPart01 from '@/public/addac112-looper/data/part-01.json';
import addac112LooperPart02 from '@/public/addac112-looper/data/part-02.json';

// Build part registry for oxi-one-mk2
// Note: Double-cast needed because JSON imports infer pageRange as number[]
// but our type requires [number, number] tuple
const OXI_ONE_MK2_PARTS: Record<string, ManualPart> = {
  '01': oxiOneMk2Part01 as unknown as ManualPart,
  '02': oxiOneMk2Part02 as unknown as ManualPart,
  '03': oxiOneMk2Part03 as unknown as ManualPart,
  '04': oxiOneMk2Part04 as unknown as ManualPart,
  '05': oxiOneMk2Part05 as unknown as ManualPart,
  '06': oxiOneMk2Part06 as unknown as ManualPart,
  '07': oxiOneMk2Part07 as unknown as ManualPart,
  '08': oxiOneMk2Part08 as unknown as ManualPart,
  '09': oxiOneMk2Part09 as unknown as ManualPart,
  '10': oxiOneMk2Part10 as unknown as ManualPart,
};

// Build part registry for oxi-coral
const OXI_CORAL_PARTS: Record<string, ManualPart> = {
  '01': oxiCoralPart01 as unknown as ManualPart,
  '02': oxiCoralPart02 as unknown as ManualPart,
};

// Build part registry for oxi-e16-quick-start
const OXI_E16_QUICK_START_PARTS: Record<string, ManualPart> = {
  '01': oxiE16QuickStartPart01 as unknown as ManualPart,
};

// Build part registry for oxi-e16-manual
const OXI_E16_MANUAL_PARTS: Record<string, ManualPart> = {
  '01': oxiE16ManualPart01 as unknown as ManualPart,
  '02': oxiE16ManualPart02 as unknown as ManualPart,
  '03': oxiE16ManualPart03 as unknown as ManualPart,
};

// Build part registry for addac112-looper
const ADDAC112_LOOPER_PARTS: Record<string, ManualPart> = {
  '01': addac112LooperPart01 as unknown as ManualPart,
  '02': addac112LooperPart02 as unknown as ManualPart,
};

export interface ManualRegistryEntry {
  manifest: ManualManifest;
  parts: Record<string, ManualPart>;
}

/**
 * Global registry of all available manuals
 * To add a new manual:
 * 1. Import manifest and parts
 * 2. Create parts record
 * 3. Add entry to MANUAL_REGISTRY
 */
const MANUAL_REGISTRY: Record<string, ManualRegistryEntry> = {
  'oxi-one-mk2': {
    manifest: oxiOneMk2Manifest as unknown as ManualManifest,
    parts: OXI_ONE_MK2_PARTS,
  },
  'oxi-coral': {
    manifest: oxiCoralManifest as unknown as ManualManifest,
    parts: OXI_CORAL_PARTS,
  },
  'oxi-e16-quick-start': {
    manifest: oxiE16QuickStartManifest as unknown as ManualManifest,
    parts: OXI_E16_QUICK_START_PARTS,
  },
  'oxi-e16-manual': {
    manifest: oxiE16ManualManifest as unknown as ManualManifest,
    parts: OXI_E16_MANUAL_PARTS,
  },
  'addac112-looper': {
    manifest: addac112LooperManifest as unknown as ManualManifest,
    parts: ADDAC112_LOOPER_PARTS,
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
 * Get part data for a specific manual and part number
 * @throws {Error} if manual ID or part number is not found
 */
export function getPartData(manualId: string, partNum: string): ManualPart {
  const entry = MANUAL_REGISTRY[manualId];
  if (!entry) {
    throw new Error(`Manual not found: ${manualId}`);
  }
  const part = entry.parts[partNum];
  if (!part) {
    throw new Error(`Part ${partNum} not found for manual: ${manualId}`);
  }
  return part;
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
