import { useCallback, useEffect, useState } from 'preact/hooks';
import ctl from './ctl';
import { SearchDialog } from './search-dialog';

export interface SearchTriggerProps {
  manualId: string;
  searchIndexVersion?: string;
  /** Navigate to a page (client-side, owned by the island). */
  onNavigate: (pageNum: number) => void;
}

const wrapperStyles = ctl(`
  relative
`);

// Visually matches the 32x32 utility buttons; `after:-inset-[6px]` expands the
// effective tap target to 44x44 per WCAG 2.5.5.
const buttonStyles = ctl(`
  relative
  flex items-center justify-center gap-[4px]
  h-[32px] min-w-[32px] px-[6px]
  bg-zd-gray3 hover:bg-zd-gray4
  border border-zd-gray4
  text-zd-white
  rounded-sm
  transition-colors
  cursor-pointer
  active:bg-zd-gray5
  after:content-['']
  after:absolute after:-inset-[6px]
`);

const shortcutStyles = ctl(`
  hidden md:inline
  text-zd-gray6
  text-[11px] leading-none
  font-mono
  pl-[2px]
`);

/**
 * Lucide-style magnifying glass icon, inlined to avoid pulling in an icon
 * library for a single glyph. Ported from `components/search/search-icon.tsx`.
 */
function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * Detect whether the current platform should treat ⌘ (Meta) as the primary
 * modifier — i.e. macOS, iOS, iPadOS. Returns false during SSR (no navigator)
 * so the rendered output stays stable; the real value is filled in by an
 * effect after mount.
 */
function detectIsMac(): boolean {
  if (typeof navigator === 'undefined') return false;

  const uaData = (
    navigator as Navigator & {
      userAgentData?: { platform?: string };
    }
  ).userAgentData;
  if (uaData?.platform) {
    return /mac/i.test(uaData.platform);
  }

  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent ?? '');
}

/**
 * Header-mounted control that opens the manual SearchDialog. Owns local `open`
 * state, registers a global Cmd/Ctrl+K listener, and renders the SearchDialog
 * as a sibling.
 */
export function SearchTrigger({ manualId, searchIndexVersion, onNavigate }: SearchTriggerProps) {
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Resolve platform after mount to avoid SSR/hydration mismatch on the
  // shortcut label (⌘K vs Ctrl+K).
  useEffect(() => {
    setIsMac(detectIsMac());
  }, []);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  // Global Cmd+K (Mac) / Ctrl+K (others) shortcut. We require modifier
  // exclusivity so e.g. Cmd+Ctrl+K doesn't accidentally trigger.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'k' && e.key !== 'K') return;
      const modifierMatches = isMac
        ? e.metaKey && !e.ctrlKey && !e.altKey
        : e.ctrlKey && !e.metaKey && !e.altKey;
      if (!modifierMatches) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMac]);

  return (
    <div className={wrapperStyles}>
      <button type="button" className={buttonStyles} onClick={toggle} aria-label="検索">
        <SearchIcon size={18} />
        <span className={shortcutStyles}>{isMac ? '⌘K' : 'Ctrl+K'}</span>
      </button>
      <SearchDialog
        manualId={manualId}
        searchIndexVersion={searchIndexVersion}
        open={open}
        onClose={close}
        onNavigate={onNavigate}
      />
    </div>
  );
}
