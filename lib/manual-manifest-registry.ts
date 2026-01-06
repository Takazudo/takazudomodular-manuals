/**
 * Manual Manifest Registry (Lightweight)
 *
 * This registry only imports manifest files (not full part data).
 * Use this for scenarios where you only need metadata like totalPages,
 * such as E2E test discovery, navigation, etc.
 *
 * For full manual data access, use manual-registry.ts instead.
 */

import type { ManualManifest } from './types/manual';

// Import only manifests (small JSON files)
import oxiOneMk2Manifest from '@/public/manuals/oxi-one-mk2/data/manifest.json';
import oxiCoralManifest from '@/public/manuals/oxi-coral/data/manifest.json';

/**
 * Lightweight registry of manual manifests only
 * Note: Double-cast needed because JSON imports infer pageRange as number[]
 * but our type requires [number, number] tuple in PartInfo
 */
const MANIFEST_REGISTRY: Record<string, ManualManifest> = {
  'oxi-one-mk2': oxiOneMk2Manifest as unknown as ManualManifest,
  'oxi-coral': oxiCoralManifest as unknown as ManualManifest,
};

/**
 * Get list of all available manual IDs (sorted alphabetically)
 */
export function getAvailableManuals(): string[] {
  return Object.keys(MANIFEST_REGISTRY).sort();
}

/**
 * Get manifest for a specific manual
 * @throws {Error} if manual ID is not found
 */
export function getManifest(manualId: string): ManualManifest {
  const manifest = MANIFEST_REGISTRY[manualId];
  if (!manifest) {
    throw new Error(`Manual not found: ${manualId}`);
  }
  return manifest;
}

/**
 * Check if a manual ID is valid
 */
export function isValidManual(manualId: string): boolean {
  return manualId in MANIFEST_REGISTRY;
}
