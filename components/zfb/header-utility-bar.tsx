import type { ComponentChildren } from 'preact';
import ctl from './ctl';
import type { Lang } from './lang';
import type { ViewMode } from './manual-app-types';
import { LanguageToggle } from './language-toggle';
import { SearchTrigger } from './search-trigger';
import { utilityTooltipStyles } from './tooltip-styles';

export interface HeaderUtilityBarProps {
  manualId: string;
  /** Whether the viewer is on a detail (page) route — gates view/sidebar/thumbs buttons. */
  isDetailPage: boolean;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  onToggleSidebar: () => void;
  onOpenThumbsModal: () => void;
  lang: Lang;
  setLang: (next: Lang) => void;
  availableLangs: readonly Lang[];
  searchIndexVersion?: string;
  onNavigate: (pageNum: number) => void;
}

/**
 * Manual-scoped header utility bar. In the Next.js app this lived inside
 * `components/header.tsx` and shared `useViewMode()`/`useLanguage()` context
 * with the viewer. Because zfb islands can't share context, the mega-island
 * owns all this state and threads it down as props.
 *
 * The bar positions itself `fixed` in the top-right of the 60px header strip,
 * decoupling its DOM location (a sibling of the viewer, inside the single
 * island root) from its visual location. The static title/logo chrome stays
 * in the page shell (rendered by #131's page module / layout).
 */
const barStyles = ctl(`
  fixed top-0 right-0 z-50
  h-[60px]
  flex items-center gap-[6px]
  px-hgap-sm
`);

const utilityButtonWrapperStyles = ctl(`
  relative group
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

function TooltipButton({
  onClick,
  ariaLabel,
  tooltip,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  tooltip: string;
  children: ComponentChildren;
}) {
  return (
    <div className={utilityButtonWrapperStyles}>
      <button
        type="button"
        className={utilityButtonStyles}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {children}
      </button>
      <span className={utilityTooltipStyles} role="tooltip">
        {tooltip}
      </span>
    </div>
  );
}

export function HeaderUtilityBar({
  manualId,
  isDetailPage,
  viewMode,
  onToggleViewMode,
  onToggleSidebar,
  onOpenThumbsModal,
  lang,
  setLang,
  availableLangs,
  searchIndexVersion,
  onNavigate,
}: HeaderUtilityBarProps) {
  return (
    <div className={barStyles} data-testid="header-utility-bar">
      {isDetailPage && (
        <>
          <TooltipButton
            onClick={onToggleViewMode}
            ariaLabel={viewMode === 'page' ? 'Switch to scroll mode' : 'Switch to page mode'}
            tooltip={viewMode === 'page' ? 'スクロール表示' : 'ページ表示'}
          >
            {viewMode === 'page' ? '\u{1F4C4}' : '\u{1F4DC}'}
          </TooltipButton>
          <TooltipButton onClick={onToggleSidebar} ariaLabel="Toggle sidebar" tooltip="サムネイル">
            {'☰'}
          </TooltipButton>
          <TooltipButton
            onClick={onOpenThumbsModal}
            ariaLabel="Open thumbnail grid"
            tooltip="ページ一覧"
          >
            {'⊞'}
          </TooltipButton>
        </>
      )}
      <LanguageToggle lang={lang} setLang={setLang} availableLangs={availableLangs} />
      <SearchTrigger
        manualId={manualId}
        searchIndexVersion={searchIndexVersion}
        onNavigate={onNavigate}
      />
    </div>
  );
}
