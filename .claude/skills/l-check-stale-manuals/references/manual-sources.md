# Manual source registry

Where each committed manual's currently-published revision lives, per brand — with access quirks and versioning schemes. Compiled from the issue #286 sweep (2026-07-30) and the RYK pass (#280–#283, 2026-07-29).

**This registry is maintenance data, not gospel.** Manufacturers move files, change CMSes, and rename products. Whenever a sweep finds a URL dead, moved, or superseded, UPDATE THIS FILE in the same session — the corrected URL is as much a deliverable of the sweep as the verdict table. Every URL below carries an implicit "last verified" date of the sweep date above unless noted.

## Table of contents

- [ADDAC System (21)](#addac-system-21)
- [Weston Precision Audio (10)](#weston-precision-audio-10)
- [OXI Instruments (7)](#oxi-instruments-7)
- [AI Synthesis (6)](#ai-synthesis-6)
- [RYK Modular (6)](#ryk-modular-6)
- [Recovery Effects And Devices (3)](#recovery-effects-and-devices-3)
- [Single-manual brands (4)](#single-manual-brands-4)

## ADDAC System (21)

- **Site**: www.addacsystem.com — custom site (NOT Wix). User manuals are static links under `https://www.addacsystem.com/contents/productdownload/<FILENAME>.pdf`; DIY/assembly guides under `https://media.addacsystem.com/diy_guides/<MODULE>_DIYkit.pdf`.
- **Versioning — two parallel schemes**: analogue modules print `Revision.NN` on the cover with a letter-generation filename suffix (`A_0`, `A_1`, `B_0`); microcontroller modules (ADDAC112, ADDAC207, ADDAC511) are **firmware-tied** — the product page lists one guide per firmware release (`FW1.6` … `FW2.0`) and keeps ALL older editions online. "Current" must be read from the newest product-page link text, never inferred from a filename.
- **Trap**: trailing numeric filename suffixes (`_1885`, `_3077`, `_8672`, `_4854`) are per-page upload aliases, not versions — the same bytes can live at several suffixed URLs.
- **Authoritative product-page map**: zzmod repo, `sub-packages/addac-order/src/data/addac-urls.json` (dealer catalog; keyed by model number).

| slug | product page | manual PDF (last known) |
| --- | --- | --- |
| addac104-tnetw | addacsystem.com/en/products/modules/addac100-series/addac104 | contents/productdownload/ADDAC104_VCTNet_A_1.pdf |
| addac106-tnoise | .../addac100-series/addac106 | contents/productdownload/ADDAC106_TNoise_A_0.pdf |
| addac107-acids | .../addac100-series/addac107 | contents/productdownload/ADDAC107_AcidSource_B_0.pdf |
| addac112-looper | .../addac100-series/addac112 (siblings: addac112s, addac112sf share the guide) | contents/productdownload/ADDAC112_Granular_FW2.0.pdf — firmware-tied, newest link wins |
| addac120s-strings | .../addac120-series/addac120qs (shared across 120QS/HS/MQS/MHS/BS) | contents/productdownload/ADDAC120s_FourStringsSeries_4854.pdf (alias suffix varies per page) |
| addac200pi-pedal-diy | .../addac200-series/addac200pi | media.addacsystem.com/diy_guides/ADDAC200PI_DIYkit.pdf |
| addac207-quantizer | .../addac200-series/addac207 | contents/productdownload/ADDAC_207_Quantizer_REV05.pdf — page also links superseded REV2/REV3 |
| addac210-open-heart | .../addac200-series/addac210 | contents/productdownload/ADDAC210_UsersGuide_web.pdf |
| addac215-sh | .../addac200-series/addac215 | contents/productdownload/ADDAC215_S&H_A_1.pdf |
| addac216-sumdiff | .../addac200-series/addac216 | contents/productdownload/ADDAC216_Sum&Dif_A_0.pdf (page also has a separate SignalFlow PDF — different doc, not ours) |
| addac217-gate2trig | .../addac200-series/addac217 | contents/productdownload/ADDAC217_Gate2Trig_A_0.pdf |
| addac218-atten | .../addac200-series/addac218 | contents/productdownload/ADDAC218_Attenuverters_A_0-compressed.pdf |
| addac219in-stereo-diy | .../addac200-series/addac219in | media.addacsystem.com/diy_guides/ADDAC219IN_DIYkit.pdf |
| addac219out-stereo-diy | .../addac200-series/addac219out | media.addacsystem.com/diy_guides/ADDAC219OUT_DIYkit.pdf |
| addac304-manualgates-diy | .../addac300-series/addac304 | media.addacsystem.com/diy_guides/ADDAC304_DIYkit.pdf |
| addac305-latches-diy | .../addac300-series/addac305 | media.addacsystem.com/diy_guides/ADDAC305_DIYkit.pdf |
| addac511-svgen | .../addac500-series/addac511 | contents/productdownload/ADDAC511_VCSVGenerator_FW20.pdf — firmware-tied, newest link wins |
| addac604-filter | .../addac600-series/addac604 | contents/productdownload/ADDAC604_DualFilter_A_0_3077.pdf |
| addac712-vintpre | .../addac700-series/addac712 | contents/productdownload/ADDAC712_VintagePre_A_1.pdf |
| addac713-stereomix | .../addac700-series/addac713 | contents/productdownload/ADDAC713_StereoDiscreteMixer_A_2.pdf |
| addac714-vintclip | .../addac700-series/addac714 | contents/productdownload/ADDAC714_VintageClipper_A_0.pdf |

## Weston Precision Audio (10)

- **Site**: www.westonaudio.com (the Shopify store `weston-precision-audio.myshopify.com` is only the shop front). Each module has a page `westonaudio.com/<slug>.html` linked from the homepage nav, carrying exactly one user-manual link under `westonaudio.com/assets/files/`.
- **Versioning**: document revision — cover prints `Revision NN - <date>`. Firmware (H1, HV1) ships separately as versioned zips and does not drive the manual revision.
- **Trap**: the `_rNN` filename suffix is applied inconsistently (half the manuals have none despite being at rev 3–4; some files mutate in place at a stable URL; Trivium was re-uploaded under the same suffixed name). Always re-scrape the product page AND re-hash — neither filename nor suffix proves currency.

| slug | product page | manual PDF (last known) |
| --- | --- | --- |
| weston-2v2 | westonaudio.com/2v2.html | assets/files/2v2manual_r02.pdf |
| weston-h1 | westonaudio.com/h1.html | assets/files/h1manual.pdf |
| weston-hv1 | westonaudio.com/hv1.html | assets/files/hv1manual_r03.pdf |
| weston-m3s | westonaudio.com/m3s.html | assets/files/m3smanual_r01.pdf |
| weston-pa0 | westonaudio.com/pa0.html | assets/files/pa0manual.pdf |
| weston-se1 | westonaudio.com/se1.html | assets/files/se1manual.pdf (DIY build doc `se1builddocs.pdf` on diy.html is a DIFFERENT document) |
| weston-sf1 | westonaudio.com/sf1.html | assets/files/sf1manual.pdf |
| weston-sv1 | westonaudio.com/sv1.html | assets/files/sv1manual_r01.pdf |
| weston-trivium | westonaudio.com/trivium.html | assets/files/triviummanual_r01.pdf |
| weston-tz0 | westonaudio.com/tz0.html | assets/files/tz0manual.pdf |

## OXI Instruments (7)

- **Site**: oxiinstruments.com — behind a **Cloudflare managed challenge**: plain curl and WebFetch get HTTP 403 ("Just a moment..."). Extract links by driving headless Chromium (Playwright) through the challenge. The PDFs themselves are ALL on **Google Drive** (not challenged) — download with curl via `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`.
- **Hub**: `oxiinstruments.com/support` carries every manual link; per-product pages (e.g. `/oxi-one/manual/`) mirror the same Drive IDs (occasionally different IDs pointing at byte-identical files).
- **Versioning**: firmware/SW version + revision date printed on the title page, with an in-document changelog table. **Trap**: manuals are live Google Docs re-exported on demand — content can change with NO version bump (happened to oxi-one-mk1, 2026-05). The printed version alone is not a staleness signal; Drive `Last-Modified` and the PDF `Producer` (Skia milestone) reveal re-export recency.

| slug | doc type | Drive file ID (last known) |
| --- | --- | --- |
| oxi-coral | user manual | 1Kokdq4KA3HYU9vBRl-gshFKkLov2fAR2 |
| oxi-e16-manual | full user manual | 1yZn1i96nRkosn2o6eDlj5wzuErPQEe9N |
| oxi-e16-quick-start | quick start | 1SxEcILmr1MZrjaKi4wOF50uw0nfB8med |
| oxi-meta | user manual (committed as `oxi-meta.pdf`, served as `OXI META User Manual.pdf`) | 1y4BZ7m-dTG28XkOYqOYU11DmiV9_A8jz |
| oxi-one-mk1-quick-guide | quick guide | 14zNjeBv3MyhB3nutKB2_0IouJcKF0Ing (product page uses a second, byte-identical ID) |
| oxi-one-mk1 | full user manual | 18S9YaR88RzGbJc3eaflH6dNYpyFURrpj |
| oxi-one-mk2 | full user manual (~10 MB) | 1LdJvG-GqzzKI2qw92CyZKklE7kSoZLFE |

Quick-start vs full manual are SEPARATE catalog entries here — match document type exactly.

## AI Synthesis (6)

- **Site**: aisynthesis.com (WooCommerce). Each product page links its manual as a **living Google Doc** ("The manual is here"); committed PDFs are `docs.google.com/document/d/<ID>/export?format=pdf` renders.
- **Versioning**: NONE — docs are edited in place, no revision/date anywhere. Content comparison is the only staleness signal.
- **Trap**: the exported PDF **never reproduces byte-wise** (Google's renderer version changes, e.g. `Skia/PDF m145` → `m152`), so sha256 ALWAYS mismatches. Verdict on identical text + page count is `content-equivalent`, not stale. Build guides are separate aisynthesis.com HTML pages, not PDFs — no doc-type collision risk.

| slug | product page | Google Doc ID |
| --- | --- | --- |
| ai008-matrix-mixer | aisynthesis.com/product/ai008-eurorack-matrix-mixer/ | 1gcn3qjk6PcV3AbY9X3s4xbZ4qw5JfA-nC9wfH-pdLLE |
| ai017-low-pass-gate | aisynthesis.com/product/ai017-low-pass-gate/ | 1APAjQ-LKs9sfU6A04OpP4D7E4XVvHTiLg2P4ZSPxd40 |
| ai018-stereo-matrix-mixer | aisynthesis.com/product/ai018-eurorack-stereo-matrix-mixer/ | 1wIH-RSRdjmuw3MbZT9oOvg7QPSo2nwYAKt3aOwPIx44 |
| ai022-harmonic-mixer | aisynthesis.com/product/harmonic-cp3-style-mixer/ | 1U6loljRtOCK3uVPeE4wZYzuXYsV2kjJyfLAg3eBuXDQ |
| ai026-line-io-interface | aisynthesis.com/product/ai026-eurorack-line-interface/ | 1ydOCgshRSeh-HtFA2spZkluCjQ15_cUX0PTbeMyIBRU |
| ai106-west-coast-mixer | aisynthesis.com/product/ai106-west-coast-eurorack-mixer/ | 1XL7TGYsmcuxbnMb3b3W4jrxtwcKvtg0TwDzakd4WYmM |

Known upstream quirk: the AI106 doc opens by calling itself the "AI022 Harmonic Mixer" — a manufacturer copy-paste error present in our committed copy too, NOT a staleness symptom.

## RYK Modular (6)

- **Site**: www.ryk-modular.com — product pages at `www.ryk-modular.com/product/<name>` (confirmed for time-slice in #280; verify the exact page slugs for the others on the next sweep and fill them in here).
- **Versioning**: firmware-tied for some products (Time Slice manual is titled by firmware, e.g. `TIME-SLICE-MANUAL_Firmware_V1_2.pdf`), plain doc versions for others (`ALGO-Manual-V1.pdf`, `ENVY-MACHINE-MANUAL-V1_4.pdf`).
- **History**: verified 2026-07-29 in #280–#282; Time Slice was found a full revision stale (V1 20p → FW V1.2 24p) and refreshed in PR #283.

| slug | product page | last known committed file |
| --- | --- | --- |
| ryk-algo | ryk-modular.com/product/… (verify) | ALGO-Manual-V1.pdf |
| ryk-envy | ryk-modular.com/product/… (verify) | ENVY-MACHINE-MANUAL-V1_4.pdf |
| ryk-m185 | ryk-modular.com/product/… (verify) | M185-Euro-Manual.pdf |
| ryk-night-rider | ryk-modular.com/product/… (verify) | Night-Rider-Manual.pdf |
| ryk-time-slice | ryk-modular.com/product/time-slice | TIME-SLICE-MANUAL_Firmware_V1_2.pdf |
| ryk-vector-wave | ryk-modular.com/product/… (verify) | Vector-Wave-Manual.pdf |

## Recovery Effects And Devices (3)

- **Site**: recoveryeffects.com (Shopify) — PDFs on `cdn.shopify.com/s/files/1/0018/1472/4726/files/`.
- **Best entry point**: `recoveryeffects.com/pages/manuals` — an index of ALL the brand's manual PDFs; cross-check it against the product page.
- **Versioning**: NONE printed in the PDFs. Cheapest staleness signal: the `?v=<unix-timestamp>` upload stamp on each CDN URL (a changed stamp = re-upload; hash still decides). CDN `Last-Modified` is useless (reflects cache fill, not document age). A Shopify UUID suffix appearing in a filename means re-upload under an existing name — hash-compare before concluding anything.
- **Trap**: several products exist as eurorack module AND pedal with separate manuals (Cutting Room Floor has three; Motion Pictures has a pedal sibling). Ours are the **eurorack module** manuals.

| slug | product page | manual PDF (last known) |
| --- | --- | --- |
| recovery-cutting-room-floor-v3 | recoveryeffects.com/products/cutting-room-floor-v3-eurorack-module-vintage-reel-to-reel-tape-echo-and-stutter | files/Cutting_Room_Floor_V3_manual_eurorack_module_Recovery_Effects.pdf?v=1632537196 |
| recovery-motion-pictures | recoveryeffects.com/products/motion-pictures-delay-and-reverb | files/Motion_Pictures_Eurorack_module_manual_Recovery_Effects.pdf?v=1735954165 |
| recovery-mystic | recoveryeffects.com/products/the-mystic-pre-order-semi-modular-desktop-synth | files/THE_MYSTIC_Manual_Recovery_Effects_4441da43-1e2a-4dc7-82dd-b338abda48a9.pdf?v=1668806302 |

## Single-manual brands (4)

| slug | brand | source | versioning / notes |
| --- | --- | --- | --- |
| 4ms-leqa | 4ms | 4mscompany.com/leqa → 4mscompany.com/media/LEQA/Leveling-EQ-Amplifier-Manual-v1.0.pdf | Doc revision in filename + cover date. Large file (8.3 MB) — the server is slow; use `--max-time 500` and verify `size_download` against `Content-Length` (a 120 s timeout produced a silently truncated file once) |
| wingie2 | Meng Qi | mengqimusic.com/wingie2-manual → `/s/Wingie2-Manual-v31-EN.pdf` (Squarespace, resolves to static1.squarespace.com) | Manual version tracks firmware (v3.1 ↔ FW V3.1, see mengqimusic.com/wingie2-firmware). Separate EN/CN editions — ours is EN. Image-based PDF: text extraction yields ~nothing, hash is the only comparison |
| mordax-data | Mordax | **mordax.net** (mordax.com is dead) — www.mordax.net/products/data → short link mordax.link/DATA_User_Guide → Google Drive ID 1DSUlA0fNyNqyg5bpD2xeuHEKmYQqyJry | Firmware-tied + date-stamped: cover prints `SYS V. / BOOT V. / Updated: YYMMDD`; product page names the current guide version ("Version 230310") next to the firmware version |
| shik-n32b-slim | SHIK | shik.tech/n32b-resources/ → GitHub raw: github.com/Shik-Tech/public-resources → `N32B Slim MIDI Controller User Manual.pdf` (HEAD of main) | Unversioned document; freshness = whatever is at GitHub HEAD. The official site links the GitHub repo, so GitHub counts as manufacturer-official |
