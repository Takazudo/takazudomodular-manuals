'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ctl from '@netlify/classnames-template-literals';
import { getManualTitle } from '@/lib/manual-registry';
import { useViewMode } from '@/components/viewer/view-mode-context';

const headerStyles = ctl(`
  fixed top-0 left-0 right-0 z-50
  bg-zd-gray1
  px-hgap-sm
  h-[60px]
  flex items-center justify-between
  shadow-lg shadow-zd-white/5
  font-futura
`);

const titleStyles = ctl(`
  text-lg font-bold
  text-zd-white
  zd-invert-color-link
  no-underline
  px-[8px] py-[4px]
  -mx-[8px] -my-[4px]
  rounded-xs
`);

const navRightStyles = ctl(`
  flex items-center gap-hgap-xs
`);

const utilityBarStyles = ctl(`
  flex items-center gap-[6px]
`);

const utilityButtonStyles = ctl(`
  w-[32px] h-[32px]
  flex items-center justify-center
  bg-zd-gray3 hover:bg-zd-gray4
  border border-zd-gray4
  text-zd-white text-sm
  rounded-sm
  transition-colors
  cursor-pointer
  active:bg-zd-gray5
`);

const navLinkStyles = ctl(`
  text-sm
  text-zd-white
  zd-invert-color-link
  no-underline
  flex items-center gap-hgap-xs
  px-[8px] py-[4px]
  -mx-[8px] -my-[4px]
  rounded-xs
`);

const logoStyles = ctl(`
  w-[1.2em] h-[1.2em]
  bg-current
  [mask-image:url('/manuals/img/takazudo-logo.svg')]
  [mask-size:contain]
  [mask-repeat:no-repeat]
  [mask-position:center]
`);

/**
 * Extract manualId from pathname
 * Note: With basePath: '/manuals', usePathname() returns paths WITHOUT the basePath
 * So /manuals/oxi-one-mk2/page/1 becomes /oxi-one-mk2/page/1
 * Matches: /{manualId} or /{manualId}/page/{pageNum}
 */
function extractManualId(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)/);
  return match ? match[1] : null;
}

export function Header() {
  const pathname = usePathname();
  const manualId = extractManualId(pathname);
  const title = manualId ? getManualTitle(manualId) : null;
  // With basePath, Link paths don't need /manuals prefix
  const titleHref = manualId ? `/${manualId}` : '/';

  const { viewMode, setViewMode, toggleSidebar, openThumbsModal } = useViewMode();

  return (
    <header className={headerStyles}>
      <Link href={titleHref} className={titleStyles}>
        {title || 'Manual Index'}
      </Link>
      <div className={navRightStyles}>
        <div className={utilityBarStyles}>
          <button
            type="button"
            className={utilityButtonStyles}
            onClick={() => setViewMode(viewMode === 'page' ? 'scroll' : 'page')}
            aria-label={viewMode === 'page' ? 'Switch to scroll mode' : 'Switch to page mode'}
            title={viewMode === 'page' ? 'Switch to scroll mode' : 'Switch to page mode'}
          >
            {viewMode === 'page' ? '\u{1F4C4}' : '\u{1F4DC}'}
          </button>
          <button
            type="button"
            className={utilityButtonStyles}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            {'\u2630'}
          </button>
          <button
            type="button"
            className={utilityButtonStyles}
            onClick={openThumbsModal}
            aria-label="Open thumbnail grid"
            title="Open thumbnail grid"
          >
            {'\u229E'}
          </button>
        </div>
        <a href="https://takazudomodular.com" className={navLinkStyles}>
          <span className={logoStyles} aria-hidden="true" />
          Takazudo Modular
        </a>
      </div>
    </header>
  );
}
