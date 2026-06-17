// pages/404.tsx — 404 Not Found page.
//
// zfb emits this as dist/404.html so Cloudflare Workers can serve it for
// unmatched requests (wrangler.toml: not_found_handling = "404-page").
// No paths() export needed — this is a static route with no dynamic params.

import DefaultLayout from '../layouts/default';
import ctl from '../components/zfb/ctl';

const pageStyles = ctl(`
  min-h-screen pt-[60px]
  bg-zd-gray1
  flex items-center justify-center
`);

const headingStyles = ctl(`
  text-6xl font-bold mb-vgap-md
  text-zd-white
  font-futura
`);

const bodyStyles = ctl(`
  text-lg mb-vgap-xl
  text-zd-white/70
`);

const linkStyles = ctl(`
  text-zd-white
  zd-invert-color-link
  no-underline
  px-[8px] py-[4px]
  -mx-[8px] -my-[4px]
  rounded-xs
`);

export const meta = {
  title: '404 Not Found | Takazudo Modular Manuals',
};

export default function NotFoundPage() {
  return (
    <DefaultLayout title="404 Not Found | Takazudo Modular Manuals">
      <main className={pageStyles}>
        <div className="text-center">
          <h1 className={headingStyles}>404</h1>
          <p className={bodyStyles}>ページが見つかりませんでした。</p>
          <a href="/" className={linkStyles}>
            Manual Index へ戻る
          </a>
        </div>
      </main>
    </DefaultLayout>
  );
}
