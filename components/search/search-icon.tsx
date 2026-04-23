/**
 * Lucide-style magnifying glass icon, inlined to avoid pulling in an icon
 * library for a single glyph. Stroke uses currentColor so the icon inherits
 * its color from the surrounding text. Default rendered size is 22x22 to
 * match the spec for the header search button.
 */
export interface SearchIconProps {
  size?: number;
}

export function SearchIcon({ size = 22 }: SearchIconProps) {
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
