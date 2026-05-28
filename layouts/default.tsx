// layouts/default.tsx — shared layout for all zfb pages.
// Imports global.css so the Zudo design-system tokens and base styles are
// injected into every rendered page's stylesheet (picked up by zfb-css).
// prose.css is also imported here so .zd-prose styles are always available.
import type { ComponentChildren } from 'preact';
import '../styles/global.css';
import '../styles/prose.css';

type Props = {
  title?: string;
  children: ComponentChildren;
};

export default function DefaultLayout({ title = 'Takazudo Modular Manuals', children }: Props) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
