import { signal } from '@takazudo/zfb/zudo-react';
import type { Lang } from './lang';
import type { ManualPage } from '@/lib/types/manual';
import { withBasePath } from './routing';
import { ProseContent } from './prose-content';
import {
  viewerContainerStyles,
  viewerImageColumnOuterStyles,
  viewerImageColumnStyles,
  viewerContentColumnStyles,
  viewerImageWrapperStyles,
  viewerNavigationWrapperStyles,
} from './viewer-layout-styles';

interface ViewerShellProps {
  page: ManualPage;
  pageNum: number;
  totalPages: number;
}

/** Deterministic SSR shell retained while the interactive viewer loads its data. */
export function ViewerShell({ page, pageNum, totalPages }: ViewerShellProps) {
  return (
    <div class={viewerContainerStyles} data-testid="viewer-shell-ssr">
      {/* Left Column: PDF Image */}
      <div class={viewerImageColumnOuterStyles} data-testid="page-image-column">
        <div class={viewerImageColumnStyles} data-testid="page-image-scroll">
          <div class={viewerImageWrapperStyles} data-testid="page-image-wrapper">
            {page.image ? (
              <img
                src={withBasePath(page.image)}
                alt={`Page ${pageNum}: ${page.title}`}
                class="w-full h-auto"
                data-testid="page-image"
              />
            ) : (
              <div class="text-zd-gray6 text-center p-hgap-md" data-testid="page-image-missing">
                <p class="text-lg mb-vgap-xs">画像がありません</p>
                <p class="text-sm">ページ {pageNum}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Translation */}
      <div class={viewerContentColumnStyles} data-testid="translation-column">
        <div class={viewerNavigationWrapperStyles} data-testid="page-navigation-wrapper">
          <p class="text-zd-gray6 text-sm">
            Page {pageNum} / {totalPages}
          </p>
        </div>
        {/* SSR is always JA — lang resolved post-hydration per project policy. */}
        <ProseContent page={signal(page)} lang={signal<Lang>('ja')} />
      </div>
    </div>
  );
}
