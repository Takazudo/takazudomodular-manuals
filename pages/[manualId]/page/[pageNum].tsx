// pages/[manualId]/page/[pageNum].tsx — /manuals/{id}/page/{n} viewer route.
// Ports app/[manualId]/page/[pageNum]/page.tsx for the zfb renderer.
//
// paths() enumerates ONLY oxi-one-mk2 in this sub-issue (#131).
// Full registry enumeration is generalized in Sub 7 (#133).
//
// zfb props contract: paths() props are SPREAD into the component input
// alongside params. Component receives { params: { manualId, pageNum }, ...props }
// at the top level — NOT { params, props: {...} }.
//
// SSR strategy: always renders JA content as the island's children.
// The mega-island (ManualApp) captures-and-reinjects this SSR body on
// hydration, then fetches both JA and EN data post-mount.
//
// notFound() is not needed: paths() enumeration is the validation gate.

import { Island } from '@takazudo/zfb';
import DefaultLayout from '../../../layouts/default';
import ManualApp from '../../../components/zfb/manual-app';
import { ViewerShell } from '../../../components/zfb/viewer-shell';
import { getOxiOneMk2PagesJa, getManifest } from '@/lib/zfb-registry';
import type { ManualPage } from '@/lib/types/manual';
import type { ManualAppManifest } from '../../../components/zfb/manual-app-types';
import type { Lang } from '../../../components/zfb/lang';

// ONLY oxi-one-mk2 — generalized to all manuals in #133.
const POC_MANUAL_ID = 'oxi-one-mk2';

export function paths() {
  const pagesJa = getOxiOneMk2PagesJa();
  const manifest = getManifest(POC_MANUAL_ID);
  const totalPages = manifest.totalPages;
  // EN is available for oxi-one-mk2 (fetched at runtime by ManualApp).
  const availableLangs: Lang[] = ['ja', 'en'];
  const appManifest: ManualAppManifest = {
    title: manifest.title,
    brand: manifest.brand,
    searchIndexVersion: manifest.searchIndexVersion,
  };

  return pagesJa.map((page) => {
    const pageNum = String(page.pageNum);
    return {
      params: { manualId: POC_MANUAL_ID, pageNum },
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
    };
  });
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
  const pageNumInt = currentPageNum;

  const pageTitle = `${currentPageTitle} (Page ${pageNumInt}) - ${appManifest.title}`;
  const manualHref = `/manuals/${manualId}`;

  // Reconstruct the ManualPage object for ViewerShell (server-render only).
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
      {/* The mega-island wraps both the utility bar (HeaderUtilityBar) and the
          viewer body. Its children are the SSR'd page shell, which the island
          captures-and-reinjects on hydration for a seamless first-paint. */}
      <Island when="load">
        <ManualApp
          manualId={manualId}
          initialPageNum={pageNumInt}
          totalPages={totalPages}
          availableLangs={availableLangs}
          initialLang="ja"
          manifest={appManifest}
        >
          {/* SSR'd current page body — image column + translation column.
              Visible immediately in HTML before JS hydrates. The ManualApp
              island captures this via BODY_MARKER_ATTR and reinjects it. */}
          <ViewerShell page={currentPage} pageNum={pageNumInt} totalPages={totalPages} />
        </ManualApp>
      </Island>
    </DefaultLayout>
  );
}
