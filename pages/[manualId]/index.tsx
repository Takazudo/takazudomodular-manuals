// pages/[manualId]/index.tsx — /{id} manual landing page.
// Ports app/[manualId]/page.tsx for the zfb renderer.
//
// paths() enumerates all manuals using the manifests-only zfb-registry
// (avoids bundling all pages JSON). Props are SPREAD into the component
// by the zfb runtime, so the component receives { params, ...props }
// at the top level (NOT { params, props: {...} }).
//
// Landing-page utility bar uses two small standalone islands
// (LandingLangIsland + LandingSearchIsland) since the mega-island
// only mounts on detail pages.

import { getAvailableManuals, getManifest, hasEnglish } from '@/lib/zfb-registry';
import { Island } from '@takazudo/zfb';
import DefaultLayout from '../../layouts/default';
import { ArrowLink } from '../../components/zfb/arrow-link';
import LandingLangIsland from '../../components/zfb/landing-lang-island';
import LandingSearchIsland from '../../components/zfb/landing-search-island';
import ctl from '../../components/zfb/ctl';
import type { Lang } from '../../components/zfb/lang';

export function paths() {
  const manualIds = getAvailableManuals();
  return manualIds.map((manualId) => {
    const manifest = getManifest(manualId);
    // hasEnglish() reads manifest.hasEnglish, so it correctly returns false for JA-only manuals (not just unknown IDs).
    const availableLangs: Lang[] = ['ja', ...(hasEnglish(manualId) ? ['en' as Lang] : [])];
    return {
      params: { manualId },
      props: {
        manifestTitle: manifest.title,
        manifestBrand: manifest.brand,
        searchIndexVersion: manifest.searchIndexVersion,
        updatedAt: manifest.updatedAt,
        availableLangs,
      },
    };
  });
}

// zfb spreads paths() props at top level alongside params.
// Component receives: { params: { manualId }, manifestTitle, manifestBrand, ... }
interface LandingPageInput {
  params: { manualId: string };
  manifestTitle: string;
  manifestBrand: string;
  searchIndexVersion?: string;
  updatedAt?: string;
  availableLangs: Lang[];
}

const pageStyles = ctl(`
  min-h-screen pt-[60px]
  bg-zd-gray1
  flex items-center justify-center
  overflow-x-hidden
`);

const headingStyles = ctl(`
  pb-vgap-lg
  font-futura
`);

const brandStyles = ctl(`
  block text-xl sm:text-2xl md:text-3xl lg:text-4xl pb-vgap-sm
`);

const titleStyles = ctl(`
  block text-2xl sm:text-3xl md:text-4xl lg:text-5xl
`);

const subtitleStyles = ctl(`
  block text-lg sm:text-xl md:text-2xl lg:text-3xl pt-vgap-sm
`);

const navStyles = ctl(`
  flex flex-col gap-vgap-sm
`);

const footerStyles = ctl(`
  text-lg pt-vgap-md
  leading-relaxed
  font-futura
  border-t border-zd-white
  mt-vgap-lg
  flex justify-between
`);

const codeStyles = ctl(`
  inline-block
  font-mono bg-zd-gray2 px-[.5em] py-[.1em] rounded
  leading-snug
  border border-zd-white
`);

const utilityBarStyles = ctl(`
  flex items-center gap-[6px]
  pt-vgap-sm
`);

/** Format YYYYMMDD to YYYY/MM/DD */
function formatUpdatedAt(dateStr: string | undefined): string {
  if (!dateStr || dateStr.length !== 8) {
    return '';
  }
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${year}/${month}/${day}`;
}

export default function ManualLandingPage({
  params,
  manifestTitle,
  manifestBrand,
  searchIndexVersion,
  updatedAt,
  availableLangs,
}: LandingPageInput) {
  const { manualId } = params;

  const pageTitle = `${manifestTitle} 日本語訳 | Takazudo Modular`;
  const readerHref = `/${manualId}/page/1`;
  const pdfHref = `/${manualId}/original.pdf`;
  const manualHref = `/${manualId}`;

  return (
    <DefaultLayout title={pageTitle} manualTitle={manifestTitle} manualHref={manualHref}>
      <main className={pageStyles}>
        <div className="max-w-[80%] mx-auto lg:-mx-hgap-2xl">
          <h1 className={headingStyles}>
            <span className={brandStyles}>{manifestBrand}:</span>
            <span className={titleStyles}>{manifestTitle}</span>
            <span className={subtitleStyles}>Japanese Translation（日本語訳）</span>
          </h1>

          <nav className={navStyles}>
            <ArrowLink href={readerHref}>日本語訳付きマニュアルを読む</ArrowLink>
            <ArrowLink href={pdfHref} external>
              英語版オリジナル（PDF）
            </ArrowLink>
          </nav>

          {/* Landing-page utility bar: LanguageToggle + SearchTrigger as small
              standalone islands. The mega-island only mounts on detail pages,
              so these cover language/search UX on the landing page. */}
          <div className={utilityBarStyles}>
            <Island when="idle">
              <LandingLangIsland availableLangs={availableLangs} />
            </Island>
            <Island when="idle">
              <LandingSearchIsland manualId={manualId} searchIndexVersion={searchIndexVersion} />
            </Island>
          </div>

          <p className={footerStyles}>
            <span>
              Navigation: <code className={codeStyles}>←</code>{' '}
              <code className={codeStyles}>→</code> key
            </span>
            {updatedAt && <span>Updated: {formatUpdatedAt(updatedAt)}</span>}
          </p>
        </div>
      </main>
    </DefaultLayout>
  );
}
