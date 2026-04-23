/**
 * Manual Registry
 *
 * Central registry for all manuals with explicit imports.
 * Required for Next.js static export - no dynamic require() allowed.
 *
 * Each manual exposes JA pages (always) and optionally EN pages. Consumers
 * that don't care about language get JA by default to stay backwards-compatible.
 */

import type { ManualManifest, ManualPagesData } from './types/manual';

// Import oxi-one-mk2
import oxiOneMk2Manifest from '@/public/oxi-one-mk2/data/manifest.json';
import oxiOneMk2PagesJa from '@/public/oxi-one-mk2/data/pages-ja.json';
import oxiOneMk2PagesEn from '@/public/oxi-one-mk2/data/pages-en.json';

// Import oxi-coral
import oxiCoralManifest from '@/public/oxi-coral/data/manifest.json';
import oxiCoralPagesJa from '@/public/oxi-coral/data/pages-ja.json';
import oxiCoralPagesEn from '@/public/oxi-coral/data/pages-en.json';

// Import oxi-e16-quick-start
import oxiE16QuickStartManifest from '@/public/oxi-e16-quick-start/data/manifest.json';
import oxiE16QuickStartPagesJa from '@/public/oxi-e16-quick-start/data/pages-ja.json';
import oxiE16QuickStartPagesEn from '@/public/oxi-e16-quick-start/data/pages-en.json';

// Import oxi-e16-manual
import oxiE16ManualManifest from '@/public/oxi-e16-manual/data/manifest.json';
import oxiE16ManualPagesJa from '@/public/oxi-e16-manual/data/pages-ja.json';
import oxiE16ManualPagesEn from '@/public/oxi-e16-manual/data/pages-en.json';

// Import addac112-looper
import addac112LooperManifest from '@/public/addac112-looper/data/manifest.json';
import addac112LooperPagesJa from '@/public/addac112-looper/data/pages-ja.json';
import addac112LooperPagesEn from '@/public/addac112-looper/data/pages-en.json';

// Import addac107-acids
import addac107AcidsManifest from '@/public/addac107-acids/data/manifest.json';
import addac107AcidsPagesJa from '@/public/addac107-acids/data/pages-ja.json';
import addac107AcidsPagesEn from '@/public/addac107-acids/data/pages-en.json';

// Import addac106-tnoise
import addac106TnoiseManifest from '@/public/addac106-tnoise/data/manifest.json';
import addac106TnoisePagesJa from '@/public/addac106-tnoise/data/pages-ja.json';
import addac106TnoisePagesEn from '@/public/addac106-tnoise/data/pages-en.json';

// Import addac104-tnetw
import addac104TnetwManifest from '@/public/addac104-tnetw/data/manifest.json';
import addac104TnetwPagesJa from '@/public/addac104-tnetw/data/pages-ja.json';
import addac104TnetwPagesEn from '@/public/addac104-tnetw/data/pages-en.json';

// Import addac207-quantizer
import addac207QuantizerManifest from '@/public/addac207-quantizer/data/manifest.json';
import addac207QuantizerPagesJa from '@/public/addac207-quantizer/data/pages-ja.json';
import addac207QuantizerPagesEn from '@/public/addac207-quantizer/data/pages-en.json';

// Import addac714-vintclip
import addac714VintclipManifest from '@/public/addac714-vintclip/data/manifest.json';
import addac714VintclipPagesJa from '@/public/addac714-vintclip/data/pages-ja.json';
import addac714VintclipPagesEn from '@/public/addac714-vintclip/data/pages-en.json';

// Import addac713-stereomix
import addac713StereomixManifest from '@/public/addac713-stereomix/data/manifest.json';
import addac713StereomixPagesJa from '@/public/addac713-stereomix/data/pages-ja.json';
import addac713StereomixPagesEn from '@/public/addac713-stereomix/data/pages-en.json';

// Import addac712-vintpre
import addac712VintpreManifest from '@/public/addac712-vintpre/data/manifest.json';
import addac712VintprePagesJa from '@/public/addac712-vintpre/data/pages-ja.json';
import addac712VintprePagesEn from '@/public/addac712-vintpre/data/pages-en.json';

// Import addac604-filter
import addac604FilterManifest from '@/public/addac604-filter/data/manifest.json';
import addac604FilterPagesJa from '@/public/addac604-filter/data/pages-ja.json';
import addac604FilterPagesEn from '@/public/addac604-filter/data/pages-en.json';

// Import addac305-latches-diy
import addac305LatchesDiyManifest from '@/public/addac305-latches-diy/data/manifest.json';
import addac305LatchesDiyPagesJa from '@/public/addac305-latches-diy/data/pages-ja.json';
import addac305LatchesDiyPagesEn from '@/public/addac305-latches-diy/data/pages-en.json';

// Import addac304-manualgates-diy
import addac304ManualGatesDiyManifest from '@/public/addac304-manualgates-diy/data/manifest.json';
import addac304ManualGatesDiyPagesJa from '@/public/addac304-manualgates-diy/data/pages-ja.json';
import addac304ManualGatesDiyPagesEn from '@/public/addac304-manualgates-diy/data/pages-en.json';

// Import addac219out-stereo-diy
import addac219outStereoDiyManifest from '@/public/addac219out-stereo-diy/data/manifest.json';
import addac219outStereoDiyPagesJa from '@/public/addac219out-stereo-diy/data/pages-ja.json';
import addac219outStereoDiyPagesEn from '@/public/addac219out-stereo-diy/data/pages-en.json';

// Import addac219in-stereo-diy
import addac219inStereoDiyManifest from '@/public/addac219in-stereo-diy/data/manifest.json';
import addac219inStereoDiyPagesJa from '@/public/addac219in-stereo-diy/data/pages-ja.json';
import addac219inStereoDiyPagesEn from '@/public/addac219in-stereo-diy/data/pages-en.json';

// Import addac218-atten
import addac218AttenManifest from '@/public/addac218-atten/data/manifest.json';
import addac218AttenPagesJa from '@/public/addac218-atten/data/pages-ja.json';
import addac218AttenPagesEn from '@/public/addac218-atten/data/pages-en.json';

// Import addac217-gate2trig
import addac217Gate2trigManifest from '@/public/addac217-gate2trig/data/manifest.json';
import addac217Gate2trigPagesJa from '@/public/addac217-gate2trig/data/pages-ja.json';
import addac217Gate2trigPagesEn from '@/public/addac217-gate2trig/data/pages-en.json';

// Import addac216-sumdiff
import addac216SumdiffManifest from '@/public/addac216-sumdiff/data/manifest.json';
import addac216SumdiffPagesJa from '@/public/addac216-sumdiff/data/pages-ja.json';
import addac216SumdiffPagesEn from '@/public/addac216-sumdiff/data/pages-en.json';

// Import addac215-sh
import addac215ShManifest from '@/public/addac215-sh/data/manifest.json';
import addac215ShPagesJa from '@/public/addac215-sh/data/pages-ja.json';
import addac215ShPagesEn from '@/public/addac215-sh/data/pages-en.json';

// Import addac210-open-heart
import addac210OpenHeartManifest from '@/public/addac210-open-heart/data/manifest.json';
import addac210OpenHeartPagesJa from '@/public/addac210-open-heart/data/pages-ja.json';
import addac210OpenHeartPagesEn from '@/public/addac210-open-heart/data/pages-en.json';

// Import addac200pi-pedal-diy
import addac200piPedalDiyManifest from '@/public/addac200pi-pedal-diy/data/manifest.json';
import addac200piPedalDiyPagesJa from '@/public/addac200pi-pedal-diy/data/pages-ja.json';
import addac200piPedalDiyPagesEn from '@/public/addac200pi-pedal-diy/data/pages-en.json';

// Import addac511-svgen
import addac511SvgenManifest from '@/public/addac511-svgen/data/manifest.json';
import addac511SvgenPagesJa from '@/public/addac511-svgen/data/pages-ja.json';
import addac511SvgenPagesEn from '@/public/addac511-svgen/data/pages-en.json';

// Import weston-hv1
import westonHv1Manifest from '@/public/weston-hv1/data/manifest.json';
import westonHv1PagesJa from '@/public/weston-hv1/data/pages-ja.json';
import westonHv1PagesEn from '@/public/weston-hv1/data/pages-en.json';

// Import weston-tz0
import westonTz0Manifest from '@/public/weston-tz0/data/manifest.json';
import westonTz0PagesJa from '@/public/weston-tz0/data/pages-ja.json';
import westonTz0PagesEn from '@/public/weston-tz0/data/pages-en.json';

// Import weston-se1
import westonSe1Manifest from '@/public/weston-se1/data/manifest.json';
import westonSe1PagesJa from '@/public/weston-se1/data/pages-ja.json';
import westonSe1PagesEn from '@/public/weston-se1/data/pages-en.json';

// Import weston-2v2
import weston2v2Manifest from '@/public/weston-2v2/data/manifest.json';
import weston2v2PagesJa from '@/public/weston-2v2/data/pages-ja.json';
import weston2v2PagesEn from '@/public/weston-2v2/data/pages-en.json';

// Import weston-sf1
import westonSf1Manifest from '@/public/weston-sf1/data/manifest.json';
import westonSf1PagesJa from '@/public/weston-sf1/data/pages-ja.json';
import westonSf1PagesEn from '@/public/weston-sf1/data/pages-en.json';

// Import weston-pa0
import westonPa0Manifest from '@/public/weston-pa0/data/manifest.json';
import westonPa0PagesJa from '@/public/weston-pa0/data/pages-ja.json';
import westonPa0PagesEn from '@/public/weston-pa0/data/pages-en.json';

// Import weston-h1
import westonH1Manifest from '@/public/weston-h1/data/manifest.json';
import westonH1PagesJa from '@/public/weston-h1/data/pages-ja.json';
import westonH1PagesEn from '@/public/weston-h1/data/pages-en.json';

// Import weston-sv1
import westonSv1Manifest from '@/public/weston-sv1/data/manifest.json';
import westonSv1PagesJa from '@/public/weston-sv1/data/pages-ja.json';
import westonSv1PagesEn from '@/public/weston-sv1/data/pages-en.json';

// Import ai008-matrix-mixer
import ai008MatrixMixerManifest from '@/public/ai008-matrix-mixer/data/manifest.json';
import ai008MatrixMixerPagesJa from '@/public/ai008-matrix-mixer/data/pages-ja.json';
import ai008MatrixMixerPagesEn from '@/public/ai008-matrix-mixer/data/pages-en.json';

// Import ai017-low-pass-gate
import ai017LowPassGateManifest from '@/public/ai017-low-pass-gate/data/manifest.json';
import ai017LowPassGatePagesJa from '@/public/ai017-low-pass-gate/data/pages-ja.json';
import ai017LowPassGatePagesEn from '@/public/ai017-low-pass-gate/data/pages-en.json';

// Import ai018-stereo-matrix-mixer
import ai018StereoMatrixMixerManifest from '@/public/ai018-stereo-matrix-mixer/data/manifest.json';
import ai018StereoMatrixMixerPagesJa from '@/public/ai018-stereo-matrix-mixer/data/pages-ja.json';
import ai018StereoMatrixMixerPagesEn from '@/public/ai018-stereo-matrix-mixer/data/pages-en.json';

// Import ai022-harmonic-mixer
import ai022HarmonicMixerManifest from '@/public/ai022-harmonic-mixer/data/manifest.json';
import ai022HarmonicMixerPagesJa from '@/public/ai022-harmonic-mixer/data/pages-ja.json';
import ai022HarmonicMixerPagesEn from '@/public/ai022-harmonic-mixer/data/pages-en.json';

// Import ai026-line-io-interface
import ai026LineIoInterfaceManifest from '@/public/ai026-line-io-interface/data/manifest.json';
import ai026LineIoInterfacePagesJa from '@/public/ai026-line-io-interface/data/pages-ja.json';
import ai026LineIoInterfacePagesEn from '@/public/ai026-line-io-interface/data/pages-en.json';

// Import ai106-west-coast-mixer
import ai106WestCoastMixerManifest from '@/public/ai106-west-coast-mixer/data/manifest.json';
import ai106WestCoastMixerPagesJa from '@/public/ai106-west-coast-mixer/data/pages-ja.json';
import ai106WestCoastMixerPagesEn from '@/public/ai106-west-coast-mixer/data/pages-en.json';

// Import shik-n32b-slim
import shikN32bSlimManifest from '@/public/shik-n32b-slim/data/manifest.json';
import shikN32bSlimPagesJa from '@/public/shik-n32b-slim/data/pages-ja.json';
import shikN32bSlimPagesEn from '@/public/shik-n32b-slim/data/pages-en.json';

// Import weston-trivium
import westonTriviumManifest from '@/public/weston-trivium/data/manifest.json';
import westonTriviumPagesJa from '@/public/weston-trivium/data/pages-ja.json';
import westonTriviumPagesEn from '@/public/weston-trivium/data/pages-en.json';

// Import weston-m3s
import westonM3sManifest from '@/public/weston-m3s/data/manifest.json';
import westonM3sPagesJa from '@/public/weston-m3s/data/pages-ja.json';
import westonM3sPagesEn from '@/public/weston-m3s/data/pages-en.json';

// Import mordax-data
import mordaxDataManifest from '@/public/mordax-data/data/manifest.json';
import mordaxDataPagesJa from '@/public/mordax-data/data/pages-ja.json';
import mordaxDataPagesEn from '@/public/mordax-data/data/pages-en.json';

// Import oxi-meta
import oxiMetaManifest from '@/public/oxi-meta/data/manifest.json';
import oxiMetaPagesJa from '@/public/oxi-meta/data/pages-ja.json';
import oxiMetaPagesEn from '@/public/oxi-meta/data/pages-en.json';

// Import ryk-envy
import rykEnvyManifest from '@/public/ryk-envy/data/manifest.json';
import rykEnvyPagesJa from '@/public/ryk-envy/data/pages-ja.json';
import rykEnvyPagesEn from '@/public/ryk-envy/data/pages-en.json';

// Import ryk-algo
import rykAlgoManifest from '@/public/ryk-algo/data/manifest.json';
import rykAlgoPagesJa from '@/public/ryk-algo/data/pages-ja.json';
import rykAlgoPagesEn from '@/public/ryk-algo/data/pages-en.json';

// Import ryk-m185
import rykM185Manifest from '@/public/ryk-m185/data/manifest.json';
import rykM185PagesJa from '@/public/ryk-m185/data/pages-ja.json';
import rykM185PagesEn from '@/public/ryk-m185/data/pages-en.json';

// Import ryk-vector-wave
import rykVectorWaveManifest from '@/public/ryk-vector-wave/data/manifest.json';
import rykVectorWavePagesJa from '@/public/ryk-vector-wave/data/pages-ja.json';
import rykVectorWavePagesEn from '@/public/ryk-vector-wave/data/pages-en.json';

// Import ryk-night-rider
import rykNightRiderManifest from '@/public/ryk-night-rider/data/manifest.json';
import rykNightRiderPagesJa from '@/public/ryk-night-rider/data/pages-ja.json';
import rykNightRiderPagesEn from '@/public/ryk-night-rider/data/pages-en.json';

// Import ryk-time-slice
import rykTimeSliceManifest from '@/public/ryk-time-slice/data/manifest.json';
import rykTimeSlicePagesJa from '@/public/ryk-time-slice/data/pages-ja.json';
import rykTimeSlicePagesEn from '@/public/ryk-time-slice/data/pages-en.json';

export type ManualLanguage = 'ja' | 'en';

export interface ManualRegistryEntry {
  manifest: ManualManifest;
  pagesJa: ManualPagesData;
  pagesEn?: ManualPagesData;
}

/**
 * Global registry of all available manuals.
 *
 * To add a new manual:
 * 1. Import manifest and pages-ja.json (and pages-en.json if available)
 * 2. Add entry to MANUAL_REGISTRY with pagesJa (required) and pagesEn (optional)
 */
const MANUAL_REGISTRY: Record<string, ManualRegistryEntry> = {
  'oxi-one-mk2': {
    manifest: oxiOneMk2Manifest as unknown as ManualManifest,
    pagesJa: oxiOneMk2PagesJa as unknown as ManualPagesData,
    pagesEn: oxiOneMk2PagesEn as unknown as ManualPagesData,
  },
  'oxi-coral': {
    manifest: oxiCoralManifest as unknown as ManualManifest,
    pagesJa: oxiCoralPagesJa as unknown as ManualPagesData,
    pagesEn: oxiCoralPagesEn as unknown as ManualPagesData,
  },
  'oxi-e16-quick-start': {
    manifest: oxiE16QuickStartManifest as unknown as ManualManifest,
    pagesJa: oxiE16QuickStartPagesJa as unknown as ManualPagesData,
    pagesEn: oxiE16QuickStartPagesEn as unknown as ManualPagesData,
  },
  'oxi-e16-manual': {
    manifest: oxiE16ManualManifest as unknown as ManualManifest,
    pagesJa: oxiE16ManualPagesJa as unknown as ManualPagesData,
    pagesEn: oxiE16ManualPagesEn as unknown as ManualPagesData,
  },
  'addac112-looper': {
    manifest: addac112LooperManifest as unknown as ManualManifest,
    pagesJa: addac112LooperPagesJa as unknown as ManualPagesData,
    pagesEn: addac112LooperPagesEn as unknown as ManualPagesData,
  },
  'addac107-acids': {
    manifest: addac107AcidsManifest as unknown as ManualManifest,
    pagesJa: addac107AcidsPagesJa as unknown as ManualPagesData,
    pagesEn: addac107AcidsPagesEn as unknown as ManualPagesData,
  },
  'addac106-tnoise': {
    manifest: addac106TnoiseManifest as unknown as ManualManifest,
    pagesJa: addac106TnoisePagesJa as unknown as ManualPagesData,
    pagesEn: addac106TnoisePagesEn as unknown as ManualPagesData,
  },
  'addac104-tnetw': {
    manifest: addac104TnetwManifest as unknown as ManualManifest,
    pagesJa: addac104TnetwPagesJa as unknown as ManualPagesData,
    pagesEn: addac104TnetwPagesEn as unknown as ManualPagesData,
  },
  'addac207-quantizer': {
    manifest: addac207QuantizerManifest as unknown as ManualManifest,
    pagesJa: addac207QuantizerPagesJa as unknown as ManualPagesData,
    pagesEn: addac207QuantizerPagesEn as unknown as ManualPagesData,
  },
  'addac714-vintclip': {
    manifest: addac714VintclipManifest as unknown as ManualManifest,
    pagesJa: addac714VintclipPagesJa as unknown as ManualPagesData,
    pagesEn: addac714VintclipPagesEn as unknown as ManualPagesData,
  },
  'addac713-stereomix': {
    manifest: addac713StereomixManifest as unknown as ManualManifest,
    pagesJa: addac713StereomixPagesJa as unknown as ManualPagesData,
    pagesEn: addac713StereomixPagesEn as unknown as ManualPagesData,
  },
  'addac712-vintpre': {
    manifest: addac712VintpreManifest as unknown as ManualManifest,
    pagesJa: addac712VintprePagesJa as unknown as ManualPagesData,
    pagesEn: addac712VintprePagesEn as unknown as ManualPagesData,
  },
  'addac604-filter': {
    manifest: addac604FilterManifest as unknown as ManualManifest,
    pagesJa: addac604FilterPagesJa as unknown as ManualPagesData,
    pagesEn: addac604FilterPagesEn as unknown as ManualPagesData,
  },
  'addac305-latches-diy': {
    manifest: addac305LatchesDiyManifest as unknown as ManualManifest,
    pagesJa: addac305LatchesDiyPagesJa as unknown as ManualPagesData,
    pagesEn: addac305LatchesDiyPagesEn as unknown as ManualPagesData,
  },
  'addac304-manualgates-diy': {
    manifest: addac304ManualGatesDiyManifest as unknown as ManualManifest,
    pagesJa: addac304ManualGatesDiyPagesJa as unknown as ManualPagesData,
    pagesEn: addac304ManualGatesDiyPagesEn as unknown as ManualPagesData,
  },
  'addac219out-stereo-diy': {
    manifest: addac219outStereoDiyManifest as unknown as ManualManifest,
    pagesJa: addac219outStereoDiyPagesJa as unknown as ManualPagesData,
    pagesEn: addac219outStereoDiyPagesEn as unknown as ManualPagesData,
  },
  'addac219in-stereo-diy': {
    manifest: addac219inStereoDiyManifest as unknown as ManualManifest,
    pagesJa: addac219inStereoDiyPagesJa as unknown as ManualPagesData,
    pagesEn: addac219inStereoDiyPagesEn as unknown as ManualPagesData,
  },
  'addac218-atten': {
    manifest: addac218AttenManifest as unknown as ManualManifest,
    pagesJa: addac218AttenPagesJa as unknown as ManualPagesData,
    pagesEn: addac218AttenPagesEn as unknown as ManualPagesData,
  },
  'addac217-gate2trig': {
    manifest: addac217Gate2trigManifest as unknown as ManualManifest,
    pagesJa: addac217Gate2trigPagesJa as unknown as ManualPagesData,
    pagesEn: addac217Gate2trigPagesEn as unknown as ManualPagesData,
  },
  'addac216-sumdiff': {
    manifest: addac216SumdiffManifest as unknown as ManualManifest,
    pagesJa: addac216SumdiffPagesJa as unknown as ManualPagesData,
    pagesEn: addac216SumdiffPagesEn as unknown as ManualPagesData,
  },
  'addac215-sh': {
    manifest: addac215ShManifest as unknown as ManualManifest,
    pagesJa: addac215ShPagesJa as unknown as ManualPagesData,
    pagesEn: addac215ShPagesEn as unknown as ManualPagesData,
  },
  'addac210-open-heart': {
    manifest: addac210OpenHeartManifest as unknown as ManualManifest,
    pagesJa: addac210OpenHeartPagesJa as unknown as ManualPagesData,
    pagesEn: addac210OpenHeartPagesEn as unknown as ManualPagesData,
  },
  'addac200pi-pedal-diy': {
    manifest: addac200piPedalDiyManifest as unknown as ManualManifest,
    pagesJa: addac200piPedalDiyPagesJa as unknown as ManualPagesData,
    pagesEn: addac200piPedalDiyPagesEn as unknown as ManualPagesData,
  },
  'addac511-svgen': {
    manifest: addac511SvgenManifest as unknown as ManualManifest,
    pagesJa: addac511SvgenPagesJa as unknown as ManualPagesData,
    pagesEn: addac511SvgenPagesEn as unknown as ManualPagesData,
  },
  'weston-hv1': {
    manifest: westonHv1Manifest as unknown as ManualManifest,
    pagesJa: westonHv1PagesJa as unknown as ManualPagesData,
    pagesEn: westonHv1PagesEn as unknown as ManualPagesData,
  },
  'weston-tz0': {
    manifest: westonTz0Manifest as unknown as ManualManifest,
    pagesJa: westonTz0PagesJa as unknown as ManualPagesData,
    pagesEn: westonTz0PagesEn as unknown as ManualPagesData,
  },
  'weston-se1': {
    manifest: westonSe1Manifest as unknown as ManualManifest,
    pagesJa: westonSe1PagesJa as unknown as ManualPagesData,
    pagesEn: westonSe1PagesEn as unknown as ManualPagesData,
  },
  'weston-2v2': {
    manifest: weston2v2Manifest as unknown as ManualManifest,
    pagesJa: weston2v2PagesJa as unknown as ManualPagesData,
    pagesEn: weston2v2PagesEn as unknown as ManualPagesData,
  },
  'weston-sf1': {
    manifest: westonSf1Manifest as unknown as ManualManifest,
    pagesJa: westonSf1PagesJa as unknown as ManualPagesData,
    pagesEn: westonSf1PagesEn as unknown as ManualPagesData,
  },
  'weston-pa0': {
    manifest: westonPa0Manifest as unknown as ManualManifest,
    pagesJa: westonPa0PagesJa as unknown as ManualPagesData,
    pagesEn: westonPa0PagesEn as unknown as ManualPagesData,
  },
  'weston-h1': {
    manifest: westonH1Manifest as unknown as ManualManifest,
    pagesJa: westonH1PagesJa as unknown as ManualPagesData,
    pagesEn: westonH1PagesEn as unknown as ManualPagesData,
  },
  'weston-sv1': {
    manifest: westonSv1Manifest as unknown as ManualManifest,
    pagesJa: westonSv1PagesJa as unknown as ManualPagesData,
    pagesEn: westonSv1PagesEn as unknown as ManualPagesData,
  },
  'ai008-matrix-mixer': {
    manifest: ai008MatrixMixerManifest as unknown as ManualManifest,
    pagesJa: ai008MatrixMixerPagesJa as unknown as ManualPagesData,
    pagesEn: ai008MatrixMixerPagesEn as unknown as ManualPagesData,
  },
  'ai017-low-pass-gate': {
    manifest: ai017LowPassGateManifest as unknown as ManualManifest,
    pagesJa: ai017LowPassGatePagesJa as unknown as ManualPagesData,
    pagesEn: ai017LowPassGatePagesEn as unknown as ManualPagesData,
  },
  'ai018-stereo-matrix-mixer': {
    manifest: ai018StereoMatrixMixerManifest as unknown as ManualManifest,
    pagesJa: ai018StereoMatrixMixerPagesJa as unknown as ManualPagesData,
    pagesEn: ai018StereoMatrixMixerPagesEn as unknown as ManualPagesData,
  },
  'ai022-harmonic-mixer': {
    manifest: ai022HarmonicMixerManifest as unknown as ManualManifest,
    pagesJa: ai022HarmonicMixerPagesJa as unknown as ManualPagesData,
    pagesEn: ai022HarmonicMixerPagesEn as unknown as ManualPagesData,
  },
  'ai026-line-io-interface': {
    manifest: ai026LineIoInterfaceManifest as unknown as ManualManifest,
    pagesJa: ai026LineIoInterfacePagesJa as unknown as ManualPagesData,
    pagesEn: ai026LineIoInterfacePagesEn as unknown as ManualPagesData,
  },
  'ai106-west-coast-mixer': {
    manifest: ai106WestCoastMixerManifest as unknown as ManualManifest,
    pagesJa: ai106WestCoastMixerPagesJa as unknown as ManualPagesData,
    pagesEn: ai106WestCoastMixerPagesEn as unknown as ManualPagesData,
  },
  'shik-n32b-slim': {
    manifest: shikN32bSlimManifest as unknown as ManualManifest,
    pagesJa: shikN32bSlimPagesJa as unknown as ManualPagesData,
    pagesEn: shikN32bSlimPagesEn as unknown as ManualPagesData,
  },
  'weston-trivium': {
    manifest: westonTriviumManifest as unknown as ManualManifest,
    pagesJa: westonTriviumPagesJa as unknown as ManualPagesData,
    pagesEn: westonTriviumPagesEn as unknown as ManualPagesData,
  },
  'weston-m3s': {
    manifest: westonM3sManifest as unknown as ManualManifest,
    pagesJa: westonM3sPagesJa as unknown as ManualPagesData,
    pagesEn: westonM3sPagesEn as unknown as ManualPagesData,
  },
  'mordax-data': {
    manifest: mordaxDataManifest as unknown as ManualManifest,
    pagesJa: mordaxDataPagesJa as unknown as ManualPagesData,
    pagesEn: mordaxDataPagesEn as unknown as ManualPagesData,
  },
  'oxi-meta': {
    manifest: oxiMetaManifest as unknown as ManualManifest,
    pagesJa: oxiMetaPagesJa as unknown as ManualPagesData,
    pagesEn: oxiMetaPagesEn as unknown as ManualPagesData,
  },
  'ryk-envy': {
    manifest: rykEnvyManifest as unknown as ManualManifest,
    pagesJa: rykEnvyPagesJa as unknown as ManualPagesData,
    pagesEn: rykEnvyPagesEn as unknown as ManualPagesData,
  },
  'ryk-algo': {
    manifest: rykAlgoManifest as unknown as ManualManifest,
    pagesJa: rykAlgoPagesJa as unknown as ManualPagesData,
    pagesEn: rykAlgoPagesEn as unknown as ManualPagesData,
  },
  'ryk-m185': {
    manifest: rykM185Manifest as unknown as ManualManifest,
    pagesJa: rykM185PagesJa as unknown as ManualPagesData,
    pagesEn: rykM185PagesEn as unknown as ManualPagesData,
  },
  'ryk-vector-wave': {
    manifest: rykVectorWaveManifest as unknown as ManualManifest,
    pagesJa: rykVectorWavePagesJa as unknown as ManualPagesData,
    pagesEn: rykVectorWavePagesEn as unknown as ManualPagesData,
  },
  'ryk-night-rider': {
    manifest: rykNightRiderManifest as unknown as ManualManifest,
    pagesJa: rykNightRiderPagesJa as unknown as ManualPagesData,
    pagesEn: rykNightRiderPagesEn as unknown as ManualPagesData,
  },
  'ryk-time-slice': {
    manifest: rykTimeSliceManifest as unknown as ManualManifest,
    pagesJa: rykTimeSlicePagesJa as unknown as ManualPagesData,
    pagesEn: rykTimeSlicePagesEn as unknown as ManualPagesData,
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
 * Get pages data for a specific manual.
 *
 * - `getPagesData(manualId)` returns JA pages (backwards-compatible default).
 * - `getPagesData(manualId, 'ja')` returns JA pages.
 * - `getPagesData(manualId, 'en')` returns EN pages when available;
 *   falls back to JA pages when the manual has no EN translation yet.
 *   This never throws for a missing EN file — callers get a usable result.
 *
 * Throws only when `manualId` is not in the registry.
 */
export function getPagesData(manualId: string, lang: ManualLanguage = 'ja'): ManualPagesData {
  const entry = MANUAL_REGISTRY[manualId];
  if (!entry) {
    throw new Error(`Manual not found: ${manualId}`);
  }
  if (lang === 'en' && entry.pagesEn) {
    return entry.pagesEn;
  }
  return entry.pagesJa;
}

/**
 * Check whether a manual has translated pages in the given language.
 * JA is always present for registered manuals.
 * Returns false for unknown manual IDs.
 */
export function hasLanguage(manualId: string, lang: ManualLanguage): boolean {
  const entry = MANUAL_REGISTRY[manualId];
  if (!entry) return false;
  if (lang === 'ja') return true;
  return entry.pagesEn !== undefined;
}

/**
 * Return the languages available for a given manual, JA first.
 * Returns an empty array for unknown manual IDs.
 */
export function getAvailableLanguages(manualId: string): ManualLanguage[] {
  const entry = MANUAL_REGISTRY[manualId];
  if (!entry) return [];
  const langs: ManualLanguage[] = ['ja'];
  if (entry.pagesEn) langs.push('en');
  return langs;
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
