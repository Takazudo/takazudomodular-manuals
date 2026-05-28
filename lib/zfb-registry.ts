/**
 * Minimal zfb-page-only registry.
 *
 * The full manual-registry.ts imports ALL 52 manuals' JSON statically,
 * creating a ~10MB bundle that exceeds the embedded V8 renderer's limits.
 * This module imports ONLY what the zfb pages need during the POC phase
 * (Sub 7 / #133 will generalize):
 *
 *   - All manifests (small JSON, ~500 bytes each) — for index + landing pages.
 *   - oxi-one-mk2 pages-ja.json only — for the viewer route paths().
 *
 * The interactive client (ManualApp mega-island) fetches pages-ja/en.json at
 * runtime via fetch() so it does NOT need these in the bundle.
 */

import type { ManualManifest, ManualPage } from './types/manual';

// Manifests only (no pages JSON) — for the index and landing pages.
// Each manifest is ~500 bytes, 52 manuals ≈ 26KB total.
import oxiOneMk2Manifest from '@/public/oxi-one-mk2/data/manifest.json';
import oxiCoralManifest from '@/public/oxi-coral/data/manifest.json';
import oxiE16QuickStartManifest from '@/public/oxi-e16-quick-start/data/manifest.json';
import oxiE16ManualManifest from '@/public/oxi-e16-manual/data/manifest.json';
import addac112LooperManifest from '@/public/addac112-looper/data/manifest.json';
import addac107AcidsManifest from '@/public/addac107-acids/data/manifest.json';
import addac106TnoiseManifest from '@/public/addac106-tnoise/data/manifest.json';
import addac104TnetwManifest from '@/public/addac104-tnetw/data/manifest.json';
import addac207QuantizerManifest from '@/public/addac207-quantizer/data/manifest.json';
import addac714VintclipManifest from '@/public/addac714-vintclip/data/manifest.json';
import addac713StereomixManifest from '@/public/addac713-stereomix/data/manifest.json';
import addac712VintpreManifest from '@/public/addac712-vintpre/data/manifest.json';
import addac604FilterManifest from '@/public/addac604-filter/data/manifest.json';
import addac305LatchesDiyManifest from '@/public/addac305-latches-diy/data/manifest.json';
import addac304ManualGatesDiyManifest from '@/public/addac304-manualgates-diy/data/manifest.json';
import addac219outStereoDiyManifest from '@/public/addac219out-stereo-diy/data/manifest.json';
import addac219inStereoDiyManifest from '@/public/addac219in-stereo-diy/data/manifest.json';
import addac218AttenManifest from '@/public/addac218-atten/data/manifest.json';
import addac217Gate2trigManifest from '@/public/addac217-gate2trig/data/manifest.json';
import addac216SumdiffManifest from '@/public/addac216-sumdiff/data/manifest.json';
import addac215ShManifest from '@/public/addac215-sh/data/manifest.json';
import addac210OpenHeartManifest from '@/public/addac210-open-heart/data/manifest.json';
import addac200piPedalDiyManifest from '@/public/addac200pi-pedal-diy/data/manifest.json';
import addac511SvgenManifest from '@/public/addac511-svgen/data/manifest.json';
import westonHv1Manifest from '@/public/weston-hv1/data/manifest.json';
import westonTz0Manifest from '@/public/weston-tz0/data/manifest.json';
import westonSe1Manifest from '@/public/weston-se1/data/manifest.json';
import weston2v2Manifest from '@/public/weston-2v2/data/manifest.json';
import westonSf1Manifest from '@/public/weston-sf1/data/manifest.json';
import westonPa0Manifest from '@/public/weston-pa0/data/manifest.json';
import westonH1Manifest from '@/public/weston-h1/data/manifest.json';
import westonSv1Manifest from '@/public/weston-sv1/data/manifest.json';
import ai008MatrixMixerManifest from '@/public/ai008-matrix-mixer/data/manifest.json';
import ai017LowPassGateManifest from '@/public/ai017-low-pass-gate/data/manifest.json';
import ai018StereoMatrixMixerManifest from '@/public/ai018-stereo-matrix-mixer/data/manifest.json';
import ai022HarmonicMixerManifest from '@/public/ai022-harmonic-mixer/data/manifest.json';
import ai026LineIoInterfaceManifest from '@/public/ai026-line-io-interface/data/manifest.json';
import ai106WestCoastMixerManifest from '@/public/ai106-west-coast-mixer/data/manifest.json';
import shikN32bSlimManifest from '@/public/shik-n32b-slim/data/manifest.json';
import westonTriviumManifest from '@/public/weston-trivium/data/manifest.json';
import westonM3sManifest from '@/public/weston-m3s/data/manifest.json';
import mordaxDataManifest from '@/public/mordax-data/data/manifest.json';
import oxiMetaManifest from '@/public/oxi-meta/data/manifest.json';
import rykEnvyManifest from '@/public/ryk-envy/data/manifest.json';
import rykAlgoManifest from '@/public/ryk-algo/data/manifest.json';
import rykM185Manifest from '@/public/ryk-m185/data/manifest.json';
import rykVectorWaveManifest from '@/public/ryk-vector-wave/data/manifest.json';
import rykNightRiderManifest from '@/public/ryk-night-rider/data/manifest.json';
import rykTimeSliceManifest from '@/public/ryk-time-slice/data/manifest.json';
import wingie2Manifest from '@/public/wingie2/data/manifest.json';
import oxiOneMk1Manifest from '@/public/oxi-one-mk1/data/manifest.json';
import oxiOneMk1QuickGuideManifest from '@/public/oxi-one-mk1-quick-guide/data/manifest.json';

// oxi-one-mk2 pages-ja.json only — for viewer route paths().
// ~1.3MB; acceptable given the 280-page enum is build-time only.
import oxiOneMk2PagesJa from '@/public/oxi-one-mk2/data/pages-ja.json';

type ManifestEntry = { manifest: ManualManifest };

const MANIFESTS: Record<string, ManifestEntry> = {
  'oxi-one-mk2': { manifest: oxiOneMk2Manifest as unknown as ManualManifest },
  'oxi-coral': { manifest: oxiCoralManifest as unknown as ManualManifest },
  'oxi-e16-quick-start': { manifest: oxiE16QuickStartManifest as unknown as ManualManifest },
  'oxi-e16-manual': { manifest: oxiE16ManualManifest as unknown as ManualManifest },
  'addac112-looper': { manifest: addac112LooperManifest as unknown as ManualManifest },
  'addac107-acids': { manifest: addac107AcidsManifest as unknown as ManualManifest },
  'addac106-tnoise': { manifest: addac106TnoiseManifest as unknown as ManualManifest },
  'addac104-tnetw': { manifest: addac104TnetwManifest as unknown as ManualManifest },
  'addac207-quantizer': { manifest: addac207QuantizerManifest as unknown as ManualManifest },
  'addac714-vintclip': { manifest: addac714VintclipManifest as unknown as ManualManifest },
  'addac713-stereomix': { manifest: addac713StereomixManifest as unknown as ManualManifest },
  'addac712-vintpre': { manifest: addac712VintpreManifest as unknown as ManualManifest },
  'addac604-filter': { manifest: addac604FilterManifest as unknown as ManualManifest },
  'addac305-latches-diy': { manifest: addac305LatchesDiyManifest as unknown as ManualManifest },
  'addac304-manualgates-diy': {
    manifest: addac304ManualGatesDiyManifest as unknown as ManualManifest,
  },
  'addac219out-stereo-diy': {
    manifest: addac219outStereoDiyManifest as unknown as ManualManifest,
  },
  'addac219in-stereo-diy': {
    manifest: addac219inStereoDiyManifest as unknown as ManualManifest,
  },
  'addac218-atten': { manifest: addac218AttenManifest as unknown as ManualManifest },
  'addac217-gate2trig': { manifest: addac217Gate2trigManifest as unknown as ManualManifest },
  'addac216-sumdiff': { manifest: addac216SumdiffManifest as unknown as ManualManifest },
  'addac215-sh': { manifest: addac215ShManifest as unknown as ManualManifest },
  'addac210-open-heart': { manifest: addac210OpenHeartManifest as unknown as ManualManifest },
  'addac200pi-pedal-diy': { manifest: addac200piPedalDiyManifest as unknown as ManualManifest },
  'addac511-svgen': { manifest: addac511SvgenManifest as unknown as ManualManifest },
  'weston-hv1': { manifest: westonHv1Manifest as unknown as ManualManifest },
  'weston-tz0': { manifest: westonTz0Manifest as unknown as ManualManifest },
  'weston-se1': { manifest: westonSe1Manifest as unknown as ManualManifest },
  'weston-2v2': { manifest: weston2v2Manifest as unknown as ManualManifest },
  'weston-sf1': { manifest: westonSf1Manifest as unknown as ManualManifest },
  'weston-pa0': { manifest: westonPa0Manifest as unknown as ManualManifest },
  'weston-h1': { manifest: westonH1Manifest as unknown as ManualManifest },
  'weston-sv1': { manifest: westonSv1Manifest as unknown as ManualManifest },
  'ai008-matrix-mixer': { manifest: ai008MatrixMixerManifest as unknown as ManualManifest },
  'ai017-low-pass-gate': { manifest: ai017LowPassGateManifest as unknown as ManualManifest },
  'ai018-stereo-matrix-mixer': {
    manifest: ai018StereoMatrixMixerManifest as unknown as ManualManifest,
  },
  'ai022-harmonic-mixer': { manifest: ai022HarmonicMixerManifest as unknown as ManualManifest },
  'ai026-line-io-interface': {
    manifest: ai026LineIoInterfaceManifest as unknown as ManualManifest,
  },
  'ai106-west-coast-mixer': {
    manifest: ai106WestCoastMixerManifest as unknown as ManualManifest,
  },
  'shik-n32b-slim': { manifest: shikN32bSlimManifest as unknown as ManualManifest },
  'weston-trivium': { manifest: westonTriviumManifest as unknown as ManualManifest },
  'weston-m3s': { manifest: westonM3sManifest as unknown as ManualManifest },
  'mordax-data': { manifest: mordaxDataManifest as unknown as ManualManifest },
  'oxi-meta': { manifest: oxiMetaManifest as unknown as ManualManifest },
  'ryk-envy': { manifest: rykEnvyManifest as unknown as ManualManifest },
  'ryk-algo': { manifest: rykAlgoManifest as unknown as ManualManifest },
  'ryk-m185': { manifest: rykM185Manifest as unknown as ManualManifest },
  'ryk-vector-wave': { manifest: rykVectorWaveManifest as unknown as ManualManifest },
  'ryk-night-rider': { manifest: rykNightRiderManifest as unknown as ManualManifest },
  'ryk-time-slice': { manifest: rykTimeSliceManifest as unknown as ManualManifest },
  wingie2: { manifest: wingie2Manifest as unknown as ManualManifest },
  'oxi-one-mk1': { manifest: oxiOneMk1Manifest as unknown as ManualManifest },
  'oxi-one-mk1-quick-guide': {
    manifest: oxiOneMk1QuickGuideManifest as unknown as ManualManifest,
  },
};

/** All manual IDs, sorted alphabetically — same as manual-registry.getAvailableManuals(). */
export function getAvailableManuals(): string[] {
  return Object.keys(MANIFESTS).sort();
}

/** Get manifest for a specific manual. */
export function getManifest(manualId: string): ManualManifest {
  const entry = MANIFESTS[manualId];
  if (!entry) throw new Error(`Manual not found: ${manualId}`);
  return entry.manifest;
}

/** Check if a manual has English pages available. */
export function hasEnglish(_manualId: string): boolean {
  // In the POC we only bundle oxi-one-mk2 pages; EN availability comes
  // from the manifest check. This mirrors getAvailableLanguages() from
  // manual-registry but without importing pagesEn JSON for all manuals.
  // The ManualApp island fetches pages-*.json at runtime, so we only need
  // to know IF en is available (which the manifest doesn't store directly).
  // For now, default to true for all manuals (conservative; the island
  // will simply fail the fetch for manuals without EN and fall back).
  // TODO #133: expose hasEnglish in manifest.json at build time.
  return true;
}

/** All pages from oxi-one-mk2 pages-ja.json (for paths() enumeration only). */
export function getOxiOneMk2PagesJa(): ManualPage[] {
  return (oxiOneMk2PagesJa as unknown as { pages: ManualPage[] }).pages;
}
