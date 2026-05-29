/**
 * Shared tooltip class-string factory for utility-bar tooltips.
 *
 * Consumers:
 *   - header-utility-bar.tsx  — tooltips triggered by group-hover only
 *   - language-toggle.tsx     — tooltip also triggers on group-focus-within
 *                               (keyboard accessibility for the EN segment)
 *
 * The two sites share the same visual appearance; the only difference is whether
 * `group-focus-within:opacity-100` is included. The parameter keeps the token in
 * its original position so the rendered class string is byte-identical to what
 * each file previously produced.
 */
import ctl from './ctl';

/**
 * Returns the tooltip class string.
 *
 * @param focusWithin - When true, adds `group-focus-within:opacity-100` after
 *   `group-hover:opacity-100` (required by language-toggle for keyboard access).
 *   Pass false (or omit) for header-utility-bar tooltips.
 */
export function makeTooltipStyles(focusWithin = false): string {
  return ctl(`
    absolute top-full left-1/2 -translate-x-1/2
    mt-[6px]
    px-hgap-xs py-vgap-2xs
    bg-zd-gray3 border border-zd-gray4
    text-zd-white text-xs
    whitespace-nowrap
    rounded-sm
    opacity-0 pointer-events-none
    group-hover:opacity-100 ${focusWithin ? 'group-focus-within:opacity-100' : ''}
    transition-opacity duration-200
    z-50
  `);
}

/** Tooltip styles for header-utility-bar buttons (hover only). */
export const utilityTooltipStyles = makeTooltipStyles(false);

/** Tooltip styles for language-toggle EN segment (hover + keyboard focus). */
export const langTooltipStyles = makeTooltipStyles(true);
