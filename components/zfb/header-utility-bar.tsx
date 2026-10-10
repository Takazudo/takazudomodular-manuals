import { computed, Show, type Child, type ReadonlySignal } from '@takazudo/zfb/zudo-react';
import type { Lang } from './lang';
import type { ViewMode } from './manual-app-types';
import { LanguageToggle } from './language-toggle';
import { SearchTrigger } from './search-trigger';
import { utilityTooltipStyles } from './tooltip-styles';

export interface HeaderUtilityBarProps {
  manualId: string;
  /** Whether the viewer is on a detail (page) route — gates view/sidebar/thumbs buttons. */
  isDetailPage: boolean;
  viewMode: ReadonlySignal<ViewMode>;
  onToggleViewMode: () => void;
  onToggleSidebar: () => void;
  onOpenThumbsModal: () => void;
  /** Hover-zoom enabled flag (page mode only). */
  zoomEnabled: ReadonlySignal<boolean>;
  onToggleZoom: () => void;
  lang: ReadonlySignal<Lang>;
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
const barStyles = 'fixed top-0 right-0 z-50 h-[60px] flex items-center gap-[6px] px-hgap-sm';

const utilityButtonWrapperStyles = 'relative group';

const utilityButtonBaseStyles =
  'w-[32px] h-[32px] flex items-center justify-center border border-zd-gray4 text-zd-white text-sm rounded-sm transition-colors cursor-pointer';

// Resting toggle: gray3 base, lighten on hover, darken on press.
const utilityButtonInactiveStyles = 'bg-zd-gray3 hover:bg-zd-gray4 active:bg-zd-gray5';

// Engaged toggle (aria-pressed): persistent darkened fill, matching the
// LanguageToggle's active-segment treatment (bg-zd-gray5).
const utilityButtonActiveStyles = 'bg-zd-gray5 hover:bg-zd-gray4';

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function TooltipButton({
  onClick,
  ariaLabel,
  tooltip,
  active,
  children,
}: {
  onClick: () => void;
  ariaLabel: string | ReadonlySignal<string>;
  tooltip: string | ReadonlySignal<string>;
  /** When defined, the button is a toggle: reflected via aria-pressed + fill. */
  active?: ReadonlySignal<boolean>;
  children: Child;
}) {
  const buttonClass = computed(() =>
    cx(
      utilityButtonBaseStyles,
      active?.value ? utilityButtonActiveStyles : utilityButtonInactiveStyles,
    ),
  );
  return (
    <div class={utilityButtonWrapperStyles}>
      <button
        type="button"
        class={buttonClass}
        on:click={onClick}
        aria-label={ariaLabel}
        aria-pressed={active}
      >
        {children}
      </button>
      <span class={utilityTooltipStyles} role="tooltip">
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
  zoomEnabled,
  onToggleZoom,
  lang,
  setLang,
  availableLangs,
  searchIndexVersion,
  onNavigate,
}: HeaderUtilityBarProps) {
  return (
    <div class={barStyles} data-testid="header-utility-bar">
      {isDetailPage && (
        <>
          <TooltipButton
            onClick={onToggleViewMode}
            ariaLabel={computed(() =>
              viewMode.value === 'page' ? 'Switch to scroll mode' : 'Switch to page mode',
            )}
            tooltip={computed(() => (viewMode.value === 'page' ? 'スクロール表示' : 'ページ表示'))}
          >
            {computed(() => (viewMode.value === 'page' ? '\u{1F4C4}' : '\u{1F4DC}'))}
          </TooltipButton>
          {/* Hover-zoom is a page-mode-only interaction (left image / right text);
              hide the toggle in scroll mode rather than offer a no-op button. */}
          <Show when={computed(() => viewMode.value === 'page')}>
            {() => (
              <TooltipButton
                onClick={onToggleZoom}
                ariaLabel={computed(() =>
                  zoomEnabled.value ? 'Disable hover zoom' : 'Enable hover zoom',
                )}
                tooltip={computed(() => (zoomEnabled.value ? '拡大表示オフ' : '拡大表示オン'))}
                active={zoomEnabled}
              >
                {'\u{1F50D}'}
              </TooltipButton>
            )}
          </Show>
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
