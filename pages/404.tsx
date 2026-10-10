// pages/404.tsx — 404 Not Found page.
//
// zfb emits this as dist/404.html so Cloudflare Workers can serve it for
// unmatched requests (wrangler.toml: not_found_handling = "404-page").
// No paths() export needed — this is a static route with no dynamic params.

import DefaultLayout from '../layouts/default';

const pageStyles = `
  min-h-screen pt-[60px]
  flex items-center justify-center
`;

const headingStyles = `
  font-bold mb-vgap-md
  text-zd-white
  font-futura
`;

const bodyStyles = `
  text-lg mb-vgap-xl
  text-zd-white/70
`;

const linkStyles = `
  text-zd-white
  zd-invert-color-link
  no-underline
  px-[8px] py-[4px]
  -mx-[8px] -my-[4px]
  rounded-xs
`;

export const meta = {
  title: '404 Not Found | Takazudo Modular Manuals',
};

export default function NotFoundPage() {
  return (
    <DefaultLayout title="404 Not Found | Takazudo Modular Manuals">
      <main class={pageStyles}>
        <div class="text-center">
          <h1 class={headingStyles}>404</h1>
          <p class={bodyStyles}>ページが見つかりませんでした。</p>
          <a href="/" class={linkStyles}>
            Manual Index へ戻る
          </a>
        </div>
      </main>
    </DefaultLayout>
  );
}
