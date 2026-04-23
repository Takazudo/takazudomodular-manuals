'use client';

import { useCallback, useEffect, useState } from 'react';
import ctl from '@netlify/classnames-template-literals';
import { SearchDialog } from './search-dialog';
import { SearchIcon } from './search-icon';

export interface SearchTriggerProps {
  manualId: string | null;
}

const wrapperStyles = ctl(`
  relative
`);

// Visually matches the existing 32x32 utility buttons in the header (so the
// new control blends with the surrounding ⊞ / ☰ buttons), while the
// `after:-inset-[6px]` pseudo-element expands the effective tap target to
// 44x44 per WCAG 2.5.5 (see /css-wisdom touch-target-sizing).
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
 * Header-mounted control that opens the manual SearchDialog. Owns local
 * `open` state, registers a global Cmd/Ctrl+K listener, and renders the
 * SearchDialog as a sibling. Renders nothing when no manualId is available
 * (e.g. on the root manual index).
 */
export function SearchTrigger({ manualId }: SearchTriggerProps) {
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Resolve platform after mount to avoid SSR/hydration mismatch on the
  // shortcut label (⌘K vs Ctrl+K).
  useEffect(() => {
    setIsMac(detectIsMac());
  }, []);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  // Global Cmd+K (Mac) / Ctrl+K (others) shortcut. Pressing the same combo
  // while open closes the dialog. We require modifier exclusivity so e.g.
  // Cmd+Ctrl+K doesn't accidentally trigger.
  useEffect(() => {
    if (!manualId) return;

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
  }, [isMac, manualId]);

  if (!manualId) {
    return null;
  }

  return (
    <div className={wrapperStyles}>
      <button type="button" className={buttonStyles} onClick={toggle} aria-label="検索">
        <SearchIcon size={18} />
        <span className={shortcutStyles}>{isMac ? '⌘K' : 'Ctrl+K'}</span>
      </button>
      <SearchDialog manualId={manualId} open={open} onClose={close} />
    </div>
  );
}
