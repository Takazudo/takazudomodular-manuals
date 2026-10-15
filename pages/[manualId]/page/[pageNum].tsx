// pages/[manualId]/page/[pageNum].tsx — /{id}/page/{n} viewer route.
// Ports app/[manualId]/page/[pageNum]/page.tsx for the zfb renderer.
//
// paths() enumerates ALL 52 manuals × every page (1122 routes total).
// Generalized from the oxi-one-mk2-only POC in Sub 6 (#131) by Sub 7 (#133).
//
// zfb props contract: paths() props are SPREAD into the component input
// alongside params. Component receives { params: { manualId, pageNum }, ...props }
// at the top level — NOT { params, props: {...} }.
//
// SSR strategy: transport the initial JA page as JSON, then render the same
// owned shell on server and client until the full page collections load.
//
// Bundle-size note: zfb-registry.ts statically imports only pages-ja.json
// for all 52 manuals (~4MB total), keeping the V8 bundle under the ~10MB
// threshold where silent 500s occur. pages-en.json is NOT bundled; ManualApp
// fetches it at runtime. See zfb-registry.ts for full design rationale.
//
// notFound() is not needed: paths() enumeration is the validation gate.

import { Island } from '@takazudo/zfb';
import DefaultLayout from '../../../layouts/default';
import ManualApp from '../../../components/zfb/manual-app';
import { getAvailableManuals, getManifest, getPagesJa, hasEnglish } from '@/lib/zfb-registry';
import type { ManualPage } from '@/lib/types/manual';
import type { ManualAppManifest } from '../../../components/zfb/manual-app-types';
import type { Lang } from '../../../components/zfb/lang';

export function paths() {
  const entries = [];

  for (const manualId of getAvailableManuals()) {
    const pagesJa = getPagesJa(manualId);
    const manifest = getManifest(manualId);
    const totalPages = manifest.totalPages;
    // hasEnglish() reads manifest.hasEnglish, so it correctly returns false for JA-only manuals (not just unknown IDs).
    const availableLangs: Lang[] = ['ja', ...(hasEnglish(manualId) ? ['en' as Lang] : [])];
    const appManifest: ManualAppManifest = {
      title: manifest.title,
      brand: manifest.brand,
      searchIndexVersion: manifest.searchIndexVersion,
    };

    for (const page of pagesJa) {
      const pageNum = String(page.pageNum);
      entries.push({
        params: { manualId, pageNum },
        props: {
          // Pass page data as scalar-compatible fields.
          // ManualPage contains contentHtml (large) and is serialized into
          // paths() props only for SSR; the client fetches full data via
          // ManualApp's useEffect fetch. This is acceptable build-time cost.
          currentPageNum: page.pageNum,
          currentPageTitle: page.title,
          currentPageImage: page.image,
          currentPageHasContent: page.hasContent,
          currentPageContentHtml: page.contentHtml ?? '',
          totalPages,
          availableLangs,
          appManifest,
        },
      });
    }
  }

  return entries;
}

// zfb spreads paths() props at top level alongside params.
interface ViewerPageInput {
  params: { manualId: string; pageNum: string };
  currentPageNum: number;
  currentPageTitle: string;
  currentPageImage: string;
  currentPageHasContent: boolean;
  currentPageContentHtml: string;
  totalPages: number;
  availableLangs: Lang[];
  appManifest: ManualAppManifest;
}

export default function ViewerPage({
  params,
  currentPageNum,
  currentPageTitle,
  currentPageImage,
  currentPageHasContent,
  currentPageContentHtml,
  totalPages,
  availableLangs,
  appManifest,
}: ViewerPageInput) {
  const { manualId } = params;

  const pageTitle = `${currentPageTitle} (Page ${currentPageNum}) - ${appManifest.title}`;
  const manualHref = `/${manualId}`;

  // The JSON-safe initial page renders identically on the server and client.
  const currentPage: ManualPage = {
    pageNum: currentPageNum,
    title: currentPageTitle,
    image: currentPageImage,
    hasContent: currentPageHasContent,
    contentHtml: currentPageContentHtml || undefined,
    content: '',
    sectionName: null,
  };

  return (
    <DefaultLayout title={pageTitle} manualTitle={appManifest.title} manualHref={manualHref}>
      <Island when="load">
        <ManualApp
          manualId={manualId}
          initialPageNum={currentPageNum}
          initialPage={currentPage}
          totalPages={totalPages}
          availableLangs={availableLangs}
          manifest={appManifest}
        />
      </Island>
    </DefaultLayout>
  );
}
