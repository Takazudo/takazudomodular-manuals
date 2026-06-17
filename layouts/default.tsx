// layouts/default.tsx — shared layout for all zfb pages.
//
// Imports global.css so the Zudo design-system tokens and base styles are
// injected into every rendered page's stylesheet (picked up by zfb-css).
// prose.css is also imported here so .zd-prose styles are always available.
//
// Noto Sans JP is loaded via Google Fonts <link> (replaces next/font/google).
// The --font-noto CSS variable is defined in styles/global.css and wires the
// Tailwind `font-noto` utility, keeping existing component class usage intact.
//
// The logo CSS mask references /img/takazudo-logo.svg served from public/img/.
// zfb's link rewriter handles the base prefix automatically for CSS embedded
// in <style> tags. The mask-image arbitrary Tailwind class writes the URL into
// the stylesheet. At base `/` the path is simply `/img/takazudo-logo.svg`.
import type { ComponentChildren } from 'preact';
import '../styles/global.css';
import '../styles/prose.css';
import ctl from '../components/zfb/ctl';

// Google Fonts URL for Noto Sans JP. Includes weights 300/400/500/700 to
// match the Next.js next/font/google config in app/layout.tsx. The `display=swap`
// param prevents invisible text during load (FOIT), accepting a brief FOUT
// for Japanese glyphs — acceptable for a manual viewer where content is the
// primary concern. If Japanese-glyph FOUC is visually unacceptable during
// browser testing (#132), fall back to self-hosting a subset under
// public/fonts/ with @font-face in global.css.
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap';

// Inline pre-hydration script: reads the persisted lang preference from
// localStorage and sets `data-lang` on <html> before the first paint. This
// prevents the manual landing page from briefly flashing the wrong language
// label in the LanguageToggle island before hydration. Must be tiny and
// self-contained — the string is embedded verbatim in the <script> tag.
const LANG_BOOTSTRAP_SCRIPT = `(function(){try{var l=localStorage.getItem('zmanuals:lang');if(l==='en')document.documentElement.setAttribute('data-lang','en');}catch(e){}})();`;

// Layout header: title (left) + Takazudo Modular link (left, adjacent).
// On viewer pages, HeaderUtilityBar (manual-app.tsx) renders a separate
// `fixed top-0 right-0 z-50` cluster. Removing `justify-between` keeps the
// brand link away from the right edge so the two fixed elements do not collide.
const headerStyles = ctl(`
  fixed top-0 left-0 right-0 z-50
  bg-zd-gray1
  px-hgap-sm
  h-[60px]
  flex items-center gap-hgap-md
  shadow-lg shadow-zd-white/5
  font-futura
`);

const titleStyles = ctl(`
  text-lg font-normal
  text-zd-white
  zd-invert-color-link
  no-underline
  px-[8px] py-[4px]
  -mx-[8px] -my-[4px]
  rounded-xs
`);

const navLinkStyles = ctl(`
  text-sm font-normal
  text-zd-white
  zd-invert-color-link
  no-underline
  flex items-center gap-hgap-xs
  px-[8px] py-[4px]
  -mx-[8px] -my-[4px]
  rounded-xs
`);

// CSS mask logo. The site is deployed at the domain root (/), so the asset
// lives at /img/takazudo-logo.svg. zfb's link rewriter does not touch
// arbitrary Tailwind values embedded in the stylesheet, but at base `/` there
// is nothing to prepend — the root-relative path resolves correctly as-is.
const logoStyles = ctl(`
  w-[1.2em] h-[1.2em]
  bg-current
  [mask-image:url('/img/takazudo-logo.svg')]
  [mask-size:contain]
  [mask-repeat:no-repeat]
  [mask-position:center]
`);

type Props = {
  title?: string;
  /** Optional manual title displayed in header (when on a manual page). */
  manualTitle?: string;
  /** Optional href for the manual title link. */
  manualHref?: string;
  children: ComponentChildren;
};

export default function DefaultLayout({
  title = 'Takazudo Modular Manuals',
  manualTitle,
  manualHref,
  children,
}: Props) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        {/* Favicon: the site is deployed at the domain root, so the favicon
            lives at /favicon.ico — the browser's default location. */}
        <link rel="icon" href="/favicon.ico" />
        {/* Google Fonts: Noto Sans JP, replaces next/font/google. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
        {/* Apply lang preference before paint to prevent toggle FOUC. */}
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <header className={headerStyles}>
          {/* Manual title / site root link (left side). */}
          {manualTitle && manualHref ? (
            <a href={manualHref} className={titleStyles}>
              {manualTitle}
            </a>
          ) : (
            <a href="/" className={titleStyles}>
              Manual Index
            </a>
          )}
          {/* Takazudo Modular logo + site link (right side). */}
          <a href="https://takazudomodular.com" className={navLinkStyles}>
            <span className={logoStyles} aria-hidden="true" />
            Takazudo Modular
          </a>
        </header>
        {children}
      </body>
    </html>
  );
}
