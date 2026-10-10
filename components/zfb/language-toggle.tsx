import { computed, type ReadonlySignal } from '@takazudo/zfb/zudo-react';
import type { Lang } from './lang';
import { langTooltipStyles } from './tooltip-styles';

export interface LanguageToggleProps {
  lang: ReadonlySignal<Lang>;
  setLang: (next: Lang) => void;
  /** Languages this manual supports; EN segment is disabled when "en" is absent. */
  availableLangs: readonly Lang[];
}

/**
 * Outer frame mirrors the 32px height and gray3/gray4 treatment of the
 * neighbouring utility buttons so the segmented toggle visually blends into
 * the utility bar.
 */
const wrapperStyles =
  'inline-flex items-stretch h-[32px] bg-zd-gray3 border border-zd-gray4 rounded-sm overflow-hidden font-futura';

const segmentBaseStyles =
  'min-w-[32px] px-[8px] flex items-center justify-center text-zd-white text-xs leading-none transition-colors cursor-pointer focus:outline-none language-toggle-segment';

const segmentInactiveStyles = 'bg-zd-gray3 hover:bg-zd-gray4 active:bg-zd-gray5';

const segmentActiveStyles = 'bg-zd-gray5';

const segmentDisabledStyles = 'bg-zd-gray3 opacity-40 cursor-not-allowed';

const tooltipWrapperStyles = 'relative group flex';

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Segmented JA | EN control for the header utility bar. The mega-island owns
 * `lang`/`setLang` state internally and passes them down (no React context).
 * When the manual has no English translation, the EN button is visibly dimmed,
 * marked `aria-disabled`, and its click becomes a no-op; a tooltip explains why.
 */
export function LanguageToggle({ lang, setLang, availableLangs }: LanguageToggleProps) {
  const enAvailable = availableLangs.includes('en');
  const jaActive = computed(() => lang.value === 'ja');
  const enActive = computed(() => lang.value === 'en');

  const handleJaClick = () => {
    setLang('ja');
  };

  const handleEnClick = () => {
    if (!enAvailable) return;
    setLang('en');
  };

  const enClassName = computed(() =>
    cx(
      segmentBaseStyles,
      !enAvailable
        ? segmentDisabledStyles
        : enActive.value
          ? segmentActiveStyles
          : segmentInactiveStyles,
    ),
  );
  const jaClassName = computed(() =>
    cx(segmentBaseStyles, jaActive.value ? segmentActiveStyles : segmentInactiveStyles),
  );

  return (
    <div class={wrapperStyles} role="group" aria-label="言語切り替え">
      <button
        type="button"
        class={jaClassName}
        aria-pressed={jaActive}
        aria-label="日本語表示"
        on:click={handleJaClick}
      >
        JA
      </button>
      <div class={tooltipWrapperStyles}>
        <button
          type="button"
          class={enClassName}
          aria-pressed={enActive}
          aria-disabled={!enAvailable}
          aria-label="English"
          on:click={handleEnClick}
        >
          EN
        </button>
        {!enAvailable && (
          <span class={langTooltipStyles} role="tooltip">
            この資料は日本語のみ対応です
          </span>
        )}
      </div>
    </div>
  );
}
