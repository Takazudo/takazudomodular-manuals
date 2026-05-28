/**
 * zfb build-time registry for all 52 manuals.
 *
 * **Bundle-size design (critical — do not break this)**
 *
 * The embedded V8 renderer evaluates the bundled module graph to run paths().
 * Importing too much JSON (~10MB+) in static imports causes a silent V8 500.
 * This module is carefully scoped to avoid that:
 *
 *   - Manifests only: ~500 bytes × 52 = ~26KB total. Always safe.
 *   - pages-ja.json: ~4MB total across 52 manuals. Safe (well under 10MB).
 *   - pages-en.json: ~3.25MB — NOT imported. EN is fetched at runtime by
 *     ManualApp via fetch(), never needed in the bundle.
 *
 * Combined bundle: manifests (~26KB) + pages-ja (~4MB) + JS overhead ≈ 4–5MB.
 * This is comfortably under the ~10MB V8 silent-500 threshold observed in #131.
 *
 * **Why no node:fs in paths()**
 * The embedded V8 host stubs node:fs — every fs call throws at runtime.
 * Static imports are the only reliable way to load data in the V8 context.
 *
 * **hasEnglish**
 * All 52 current manuals have pages-en.json. The manifest JSON does not yet
 * carry a `hasEnglish` field (manifests were generated before this need).
 * hasEnglish() returns true for all manuals until a `hasEnglish` field is
 * added to manifest.json by the PDF pipeline (tracked as a follow-up).
 * The ManualApp island gracefully falls back when a fetch for pages-en.json
 * 404s, so this conservative default is safe.
 */

import type { ManualManifest, ManualPage, ManualPagesData } from './types/manual';

// ── Manifests (~26KB total) ────────────────────────────────────────────────
import addac104TnetwManifest from '@/public/addac104-tnetw/data/manifest.json';
import addac106TnoiseManifest from '@/public/addac106-tnoise/data/manifest.json';
import addac107AcidsManifest from '@/public/addac107-acids/data/manifest.json';
import addac112LooperManifest from '@/public/addac112-looper/data/manifest.json';
import addac200piPedalDiyManifest from '@/public/addac200pi-pedal-diy/data/manifest.json';
import addac207QuantizerManifest from '@/public/addac207-quantizer/data/manifest.json';
import addac210OpenHeartManifest from '@/public/addac210-open-heart/data/manifest.json';
import addac215ShManifest from '@/public/addac215-sh/data/manifest.json';
import addac216SumdiffManifest from '@/public/addac216-sumdiff/data/manifest.json';
import addac217Gate2trigManifest from '@/public/addac217-gate2trig/data/manifest.json';
import addac218AttenManifest from '@/public/addac218-atten/data/manifest.json';
import addac219inStereoDiyManifest from '@/public/addac219in-stereo-diy/data/manifest.json';
import addac219outStereoDiyManifest from '@/public/addac219out-stereo-diy/data/manifest.json';
import addac304ManualGatesDiyManifest from '@/public/addac304-manualgates-diy/data/manifest.json';
import addac305LatchesDiyManifest from '@/public/addac305-latches-diy/data/manifest.json';
import addac511SvgenManifest from '@/public/addac511-svgen/data/manifest.json';
import addac604FilterManifest from '@/public/addac604-filter/data/manifest.json';
import addac712VintpreManifest from '@/public/addac712-vintpre/data/manifest.json';
import addac713StereomixManifest from '@/public/addac713-stereomix/data/manifest.json';
import addac714VintclipManifest from '@/public/addac714-vintclip/data/manifest.json';
import ai008MatrixMixerManifest from '@/public/ai008-matrix-mixer/data/manifest.json';
import ai017LowPassGateManifest from '@/public/ai017-low-pass-gate/data/manifest.json';
import ai018StereoMatrixMixerManifest from '@/public/ai018-stereo-matrix-mixer/data/manifest.json';
import ai022HarmonicMixerManifest from '@/public/ai022-harmonic-mixer/data/manifest.json';
import ai026LineIoInterfaceManifest from '@/public/ai026-line-io-interface/data/manifest.json';
import ai106WestCoastMixerManifest from '@/public/ai106-west-coast-mixer/data/manifest.json';
import mordaxDataManifest from '@/public/mordax-data/data/manifest.json';
import oxiCoralManifest from '@/public/oxi-coral/data/manifest.json';
import oxiE16ManualManifest from '@/public/oxi-e16-manual/data/manifest.json';
import oxiE16QuickStartManifest from '@/public/oxi-e16-quick-start/data/manifest.json';
import oxiMetaManifest from '@/public/oxi-meta/data/manifest.json';
import oxiOneMk1Manifest from '@/public/oxi-one-mk1/data/manifest.json';
import oxiOneMk1QuickGuideManifest from '@/public/oxi-one-mk1-quick-guide/data/manifest.json';
import oxiOneMk2Manifest from '@/public/oxi-one-mk2/data/manifest.json';
import rykAlgoManifest from '@/public/ryk-algo/data/manifest.json';
import rykEnvyManifest from '@/public/ryk-envy/data/manifest.json';
import rykM185Manifest from '@/public/ryk-m185/data/manifest.json';
import rykNightRiderManifest from '@/public/ryk-night-rider/data/manifest.json';
import rykTimeSliceManifest from '@/public/ryk-time-slice/data/manifest.json';
import rykVectorWaveManifest from '@/public/ryk-vector-wave/data/manifest.json';
import shikN32bSlimManifest from '@/public/shik-n32b-slim/data/manifest.json';
import weston2v2Manifest from '@/public/weston-2v2/data/manifest.json';
import westonH1Manifest from '@/public/weston-h1/data/manifest.json';
import westonHv1Manifest from '@/public/weston-hv1/data/manifest.json';
import westonM3sManifest from '@/public/weston-m3s/data/manifest.json';
import westonPa0Manifest from '@/public/weston-pa0/data/manifest.json';
import westonSe1Manifest from '@/public/weston-se1/data/manifest.json';
import westonSf1Manifest from '@/public/weston-sf1/data/manifest.json';
import westonSv1Manifest from '@/public/weston-sv1/data/manifest.json';
import westonTriviumManifest from '@/public/weston-trivium/data/manifest.json';
import westonTz0Manifest from '@/public/weston-tz0/data/manifest.json';
import wingie2Manifest from '@/public/wingie2/data/manifest.json';

// ── pages-ja.json (~4MB total across 52 manuals) ──────────────────────────
// Needed in the bundle so paths() can enumerate each manual's pages at
// build time. EN pages are NOT imported; ManualApp fetches them at runtime.
import addac104TnetwPagesJa from '@/public/addac104-tnetw/data/pages-ja.json';
import addac106TnoisePagesJa from '@/public/addac106-tnoise/data/pages-ja.json';
import addac107AcidsPagesJa from '@/public/addac107-acids/data/pages-ja.json';
import addac112LooperPagesJa from '@/public/addac112-looper/data/pages-ja.json';
import addac200piPedalDiyPagesJa from '@/public/addac200pi-pedal-diy/data/pages-ja.json';
import addac207QuantizerPagesJa from '@/public/addac207-quantizer/data/pages-ja.json';
import addac210OpenHeartPagesJa from '@/public/addac210-open-heart/data/pages-ja.json';
import addac215ShPagesJa from '@/public/addac215-sh/data/pages-ja.json';
import addac216SumdiffPagesJa from '@/public/addac216-sumdiff/data/pages-ja.json';
import addac217Gate2trigPagesJa from '@/public/addac217-gate2trig/data/pages-ja.json';
import addac218AttenPagesJa from '@/public/addac218-atten/data/pages-ja.json';
import addac219inStereoDiyPagesJa from '@/public/addac219in-stereo-diy/data/pages-ja.json';
import addac219outStereoDiyPagesJa from '@/public/addac219out-stereo-diy/data/pages-ja.json';
import addac304ManualGatesDiyPagesJa from '@/public/addac304-manualgates-diy/data/pages-ja.json';
import addac305LatchesDiyPagesJa from '@/public/addac305-latches-diy/data/pages-ja.json';
import addac511SvgenPagesJa from '@/public/addac511-svgen/data/pages-ja.json';
import addac604FilterPagesJa from '@/public/addac604-filter/data/pages-ja.json';
import addac712VintprePagesJa from '@/public/addac712-vintpre/data/pages-ja.json';
import addac713StereomixPagesJa from '@/public/addac713-stereomix/data/pages-ja.json';
import addac714VintclipPagesJa from '@/public/addac714-vintclip/data/pages-ja.json';
import ai008MatrixMixerPagesJa from '@/public/ai008-matrix-mixer/data/pages-ja.json';
import ai017LowPassGatePagesJa from '@/public/ai017-low-pass-gate/data/pages-ja.json';
import ai018StereoMatrixMixerPagesJa from '@/public/ai018-stereo-matrix-mixer/data/pages-ja.json';
import ai022HarmonicMixerPagesJa from '@/public/ai022-harmonic-mixer/data/pages-ja.json';
import ai026LineIoInterfacePagesJa from '@/public/ai026-line-io-interface/data/pages-ja.json';
import ai106WestCoastMixerPagesJa from '@/public/ai106-west-coast-mixer/data/pages-ja.json';
import mordaxDataPagesJa from '@/public/mordax-data/data/pages-ja.json';
import oxiCoralPagesJa from '@/public/oxi-coral/data/pages-ja.json';
import oxiE16ManualPagesJa from '@/public/oxi-e16-manual/data/pages-ja.json';
import oxiE16QuickStartPagesJa from '@/public/oxi-e16-quick-start/data/pages-ja.json';
import oxiMetaPagesJa from '@/public/oxi-meta/data/pages-ja.json';
import oxiOneMk1PagesJa from '@/public/oxi-one-mk1/data/pages-ja.json';
import oxiOneMk1QuickGuidePagesJa from '@/public/oxi-one-mk1-quick-guide/data/pages-ja.json';
import oxiOneMk2PagesJa from '@/public/oxi-one-mk2/data/pages-ja.json';
import rykAlgoPagesJa from '@/public/ryk-algo/data/pages-ja.json';
import rykEnvyPagesJa from '@/public/ryk-envy/data/pages-ja.json';
import rykM185PagesJa from '@/public/ryk-m185/data/pages-ja.json';
import rykNightRiderPagesJa from '@/public/ryk-night-rider/data/pages-ja.json';
import rykTimeSlicePagesJa from '@/public/ryk-time-slice/data/pages-ja.json';
import rykVectorWavePagesJa from '@/public/ryk-vector-wave/data/pages-ja.json';
import shikN32bSlimPagesJa from '@/public/shik-n32b-slim/data/pages-ja.json';
import weston2v2PagesJa from '@/public/weston-2v2/data/pages-ja.json';
import westonH1PagesJa from '@/public/weston-h1/data/pages-ja.json';
import westonHv1PagesJa from '@/public/weston-hv1/data/pages-ja.json';
import westonM3sPagesJa from '@/public/weston-m3s/data/pages-ja.json';
import westonPa0PagesJa from '@/public/weston-pa0/data/pages-ja.json';
import westonSe1PagesJa from '@/public/weston-se1/data/pages-ja.json';
import westonSf1PagesJa from '@/public/weston-sf1/data/pages-ja.json';
import westonSv1PagesJa from '@/public/weston-sv1/data/pages-ja.json';
import westonTriviumPagesJa from '@/public/weston-trivium/data/pages-ja.json';
import westonTz0PagesJa from '@/public/weston-tz0/data/pages-ja.json';
import wingie2PagesJa from '@/public/wingie2/data/pages-ja.json';

// ── Registry type ──────────────────────────────────────────────────────────

interface RegistryEntry {
  manifest: ManualManifest;
  pagesJa: ManualPagesData;
}

const REGISTRY: Record<string, RegistryEntry> = {
  'addac104-tnetw': {
    manifest: addac104TnetwManifest as unknown as ManualManifest,
    pagesJa: addac104TnetwPagesJa as unknown as ManualPagesData,
  },
  'addac106-tnoise': {
    manifest: addac106TnoiseManifest as unknown as ManualManifest,
    pagesJa: addac106TnoisePagesJa as unknown as ManualPagesData,
  },
  'addac107-acids': {
    manifest: addac107AcidsManifest as unknown as ManualManifest,
    pagesJa: addac107AcidsPagesJa as unknown as ManualPagesData,
  },
  'addac112-looper': {
    manifest: addac112LooperManifest as unknown as ManualManifest,
    pagesJa: addac112LooperPagesJa as unknown as ManualPagesData,
  },
  'addac200pi-pedal-diy': {
    manifest: addac200piPedalDiyManifest as unknown as ManualManifest,
    pagesJa: addac200piPedalDiyPagesJa as unknown as ManualPagesData,
  },
  'addac207-quantizer': {
    manifest: addac207QuantizerManifest as unknown as ManualManifest,
    pagesJa: addac207QuantizerPagesJa as unknown as ManualPagesData,
  },
  'addac210-open-heart': {
    manifest: addac210OpenHeartManifest as unknown as ManualManifest,
    pagesJa: addac210OpenHeartPagesJa as unknown as ManualPagesData,
  },
  'addac215-sh': {
    manifest: addac215ShManifest as unknown as ManualManifest,
    pagesJa: addac215ShPagesJa as unknown as ManualPagesData,
  },
  'addac216-sumdiff': {
    manifest: addac216SumdiffManifest as unknown as ManualManifest,
    pagesJa: addac216SumdiffPagesJa as unknown as ManualPagesData,
  },
  'addac217-gate2trig': {
    manifest: addac217Gate2trigManifest as unknown as ManualManifest,
    pagesJa: addac217Gate2trigPagesJa as unknown as ManualPagesData,
  },
  'addac218-atten': {
    manifest: addac218AttenManifest as unknown as ManualManifest,
    pagesJa: addac218AttenPagesJa as unknown as ManualPagesData,
  },
  'addac219in-stereo-diy': {
    manifest: addac219inStereoDiyManifest as unknown as ManualManifest,
    pagesJa: addac219inStereoDiyPagesJa as unknown as ManualPagesData,
  },
  'addac219out-stereo-diy': {
    manifest: addac219outStereoDiyManifest as unknown as ManualManifest,
    pagesJa: addac219outStereoDiyPagesJa as unknown as ManualPagesData,
  },
  'addac304-manualgates-diy': {
    manifest: addac304ManualGatesDiyManifest as unknown as ManualManifest,
    pagesJa: addac304ManualGatesDiyPagesJa as unknown as ManualPagesData,
  },
  'addac305-latches-diy': {
    manifest: addac305LatchesDiyManifest as unknown as ManualManifest,
    pagesJa: addac305LatchesDiyPagesJa as unknown as ManualPagesData,
  },
  'addac511-svgen': {
    manifest: addac511SvgenManifest as unknown as ManualManifest,
    pagesJa: addac511SvgenPagesJa as unknown as ManualPagesData,
  },
  'addac604-filter': {
    manifest: addac604FilterManifest as unknown as ManualManifest,
    pagesJa: addac604FilterPagesJa as unknown as ManualPagesData,
  },
  'addac712-vintpre': {
    manifest: addac712VintpreManifest as unknown as ManualManifest,
    pagesJa: addac712VintprePagesJa as unknown as ManualPagesData,
  },
  'addac713-stereomix': {
    manifest: addac713StereomixManifest as unknown as ManualManifest,
    pagesJa: addac713StereomixPagesJa as unknown as ManualPagesData,
  },
  'addac714-vintclip': {
    manifest: addac714VintclipManifest as unknown as ManualManifest,
    pagesJa: addac714VintclipPagesJa as unknown as ManualPagesData,
  },
  'ai008-matrix-mixer': {
    manifest: ai008MatrixMixerManifest as unknown as ManualManifest,
    pagesJa: ai008MatrixMixerPagesJa as unknown as ManualPagesData,
  },
  'ai017-low-pass-gate': {
    manifest: ai017LowPassGateManifest as unknown as ManualManifest,
    pagesJa: ai017LowPassGatePagesJa as unknown as ManualPagesData,
  },
  'ai018-stereo-matrix-mixer': {
    manifest: ai018StereoMatrixMixerManifest as unknown as ManualManifest,
    pagesJa: ai018StereoMatrixMixerPagesJa as unknown as ManualPagesData,
  },
  'ai022-harmonic-mixer': {
    manifest: ai022HarmonicMixerManifest as unknown as ManualManifest,
    pagesJa: ai022HarmonicMixerPagesJa as unknown as ManualPagesData,
  },
  'ai026-line-io-interface': {
    manifest: ai026LineIoInterfaceManifest as unknown as ManualManifest,
    pagesJa: ai026LineIoInterfacePagesJa as unknown as ManualPagesData,
  },
  'ai106-west-coast-mixer': {
    manifest: ai106WestCoastMixerManifest as unknown as ManualManifest,
    pagesJa: ai106WestCoastMixerPagesJa as unknown as ManualPagesData,
  },
  'mordax-data': {
    manifest: mordaxDataManifest as unknown as ManualManifest,
    pagesJa: mordaxDataPagesJa as unknown as ManualPagesData,
  },
  'oxi-coral': {
    manifest: oxiCoralManifest as unknown as ManualManifest,
    pagesJa: oxiCoralPagesJa as unknown as ManualPagesData,
  },
  'oxi-e16-manual': {
    manifest: oxiE16ManualManifest as unknown as ManualManifest,
    pagesJa: oxiE16ManualPagesJa as unknown as ManualPagesData,
  },
  'oxi-e16-quick-start': {
    manifest: oxiE16QuickStartManifest as unknown as ManualManifest,
    pagesJa: oxiE16QuickStartPagesJa as unknown as ManualPagesData,
  },
  'oxi-meta': {
    manifest: oxiMetaManifest as unknown as ManualManifest,
    pagesJa: oxiMetaPagesJa as unknown as ManualPagesData,
  },
  'oxi-one-mk1': {
    manifest: oxiOneMk1Manifest as unknown as ManualManifest,
    pagesJa: oxiOneMk1PagesJa as unknown as ManualPagesData,
  },
  'oxi-one-mk1-quick-guide': {
    manifest: oxiOneMk1QuickGuideManifest as unknown as ManualManifest,
    pagesJa: oxiOneMk1QuickGuidePagesJa as unknown as ManualPagesData,
  },
  'oxi-one-mk2': {
    manifest: oxiOneMk2Manifest as unknown as ManualManifest,
    pagesJa: oxiOneMk2PagesJa as unknown as ManualPagesData,
  },
  'ryk-algo': {
    manifest: rykAlgoManifest as unknown as ManualManifest,
    pagesJa: rykAlgoPagesJa as unknown as ManualPagesData,
  },
  'ryk-envy': {
    manifest: rykEnvyManifest as unknown as ManualManifest,
    pagesJa: rykEnvyPagesJa as unknown as ManualPagesData,
  },
  'ryk-m185': {
    manifest: rykM185Manifest as unknown as ManualManifest,
    pagesJa: rykM185PagesJa as unknown as ManualPagesData,
  },
  'ryk-night-rider': {
    manifest: rykNightRiderManifest as unknown as ManualManifest,
    pagesJa: rykNightRiderPagesJa as unknown as ManualPagesData,
  },
  'ryk-time-slice': {
    manifest: rykTimeSliceManifest as unknown as ManualManifest,
    pagesJa: rykTimeSlicePagesJa as unknown as ManualPagesData,
  },
  'ryk-vector-wave': {
    manifest: rykVectorWaveManifest as unknown as ManualManifest,
    pagesJa: rykVectorWavePagesJa as unknown as ManualPagesData,
  },
  'shik-n32b-slim': {
    manifest: shikN32bSlimManifest as unknown as ManualManifest,
    pagesJa: shikN32bSlimPagesJa as unknown as ManualPagesData,
  },
  'weston-2v2': {
    manifest: weston2v2Manifest as unknown as ManualManifest,
    pagesJa: weston2v2PagesJa as unknown as ManualPagesData,
  },
  'weston-h1': {
    manifest: westonH1Manifest as unknown as ManualManifest,
    pagesJa: westonH1PagesJa as unknown as ManualPagesData,
  },
  'weston-hv1': {
    manifest: westonHv1Manifest as unknown as ManualManifest,
    pagesJa: westonHv1PagesJa as unknown as ManualPagesData,
  },
  'weston-m3s': {
    manifest: westonM3sManifest as unknown as ManualManifest,
    pagesJa: westonM3sPagesJa as unknown as ManualPagesData,
  },
  'weston-pa0': {
    manifest: westonPa0Manifest as unknown as ManualManifest,
    pagesJa: westonPa0PagesJa as unknown as ManualPagesData,
  },
  'weston-se1': {
    manifest: westonSe1Manifest as unknown as ManualManifest,
    pagesJa: westonSe1PagesJa as unknown as ManualPagesData,
  },
  'weston-sf1': {
    manifest: westonSf1Manifest as unknown as ManualManifest,
    pagesJa: westonSf1PagesJa as unknown as ManualPagesData,
  },
  'weston-sv1': {
    manifest: westonSv1Manifest as unknown as ManualManifest,
    pagesJa: westonSv1PagesJa as unknown as ManualPagesData,
  },
  'weston-trivium': {
    manifest: westonTriviumManifest as unknown as ManualManifest,
    pagesJa: westonTriviumPagesJa as unknown as ManualPagesData,
  },
  'weston-tz0': {
    manifest: westonTz0Manifest as unknown as ManualManifest,
    pagesJa: westonTz0PagesJa as unknown as ManualPagesData,
  },
  wingie2: {
    manifest: wingie2Manifest as unknown as ManualManifest,
    pagesJa: wingie2PagesJa as unknown as ManualPagesData,
  },
};

// ── Public API ─────────────────────────────────────────────────────────────

/** All manual IDs, sorted alphabetically. */
export function getAvailableManuals(): string[] {
  return Object.keys(REGISTRY).sort();
}

/** Get manifest for a specific manual. Throws for unknown IDs. */
export function getManifest(manualId: string): ManualManifest {
  const entry = REGISTRY[manualId];
  if (!entry) throw new Error(`Manual not found: ${manualId}`);
  return entry.manifest;
}

/**
 * Get JA pages array for a specific manual.
 * Used by paths() in [pageNum].tsx to enumerate all viewer routes.
 */
export function getPagesJa(manualId: string): ManualPage[] {
  const entry = REGISTRY[manualId];
  if (!entry) throw new Error(`Manual not found: ${manualId}`);
  return entry.pagesJa.pages;
}

/**
 * Check if a manual has English pages available.
 *
 * All 52 current manuals have pages-en.json. The manifest does not yet carry
 * a `hasEnglish` field, so this function returns true for all known manuals.
 * ManualApp falls back gracefully if pages-en.json is absent at runtime.
 * Follow-up: add `hasEnglish` to manifest.json generation in the PDF pipeline.
 */
export function hasEnglish(manualId: string): boolean {
  // All current manuals have EN. Return false only for unknown IDs.
  return manualId in REGISTRY;
}
