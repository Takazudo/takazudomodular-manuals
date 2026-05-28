import type { ManualPage } from '@/lib/types/manual';
import { withBasePath } from './routing';
import { ProseContent } from './prose-content';
import ctl from './ctl';

interface ViewerShellProps {
  page: ManualPage;
  pageNum: number;
  totalPages: number;
}

const containerStyles = ctl(`
  flex flex-col lg:flex-row
  h-full
`);

const imageColumnStyles = ctl(`
  flex-1
  overflow-y-scroll
  min-h-0
  flex flex-col items-center
  bg-zd-white
`);

const contentColumnStyles = ctl(`
  flex-1
  overflow-y-scroll
  min-h-0
  px-hgap-sm
`);

const imageWrapperStyles = ctl(`
  relative w-full
  min-h-[400px]
  h-full
  content-center
`);

const navigationWrapperStyles = ctl(`
  sticky top-0 z-10
  mb-vgap-md
  pt-vgap-sm
  px-hgap-sm
  -mx-hgap-sm
  bg-zd-black/90
`);

/**
 * Server-render-only shell for the manual viewer page body. Renders the image
 * column + translation column as the SSR'd children of the mega-island.
 * The mega-island captures-and-reinjects this markup on hydration (see
 * manual-app.tsx BODY_MARKER_ATTR pattern) and replaces it with the real
 * interactive viewer once page data is fetched.
 *
 * Uses ProseContent (not raw dangerouslySetInnerHTML) to ensure the
 * .zd-prose wrapper is present in the SSR'd HTML — required by the
 * prose.css contract established in #128.
 */
export function ViewerShell({ page, pageNum, totalPages }: ViewerShellProps) {
  return (
    <div className={containerStyles} data-testid="viewer-shell-ssr">
      {/* Left Column: PDF Image */}
      <div className={imageColumnStyles} data-testid="page-image-column">
        <div className={imageWrapperStyles} data-testid="page-image-wrapper">
          {page.image ? (
            <img
              src={withBasePath(page.image)}
              alt={`Page ${pageNum}: ${page.title}`}
              className="w-full h-auto"
              data-testid="page-image"
            />
          ) : (
            <div className="text-zd-gray6 text-center p-hgap-md" data-testid="page-image-missing">
              <p className="text-lg mb-vgap-xs">画像がありません</p>
              <p className="text-sm">ページ {pageNum}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Translation */}
      <div className={contentColumnStyles} data-testid="translation-column">
        <div className={navigationWrapperStyles} data-testid="page-navigation-wrapper">
          <p className="text-zd-gray6 text-sm">
            Page {pageNum} / {totalPages}
          </p>
        </div>
        {/* SSR is always JA — lang resolved post-hydration per project policy. */}
        <ProseContent page={page} lang="ja" />
      </div>
    </div>
  );
}
