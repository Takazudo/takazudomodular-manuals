// pages/index.tsx — /manuals/ manual index page.
// Ports app/page.tsx for the zfb renderer. Static route, no paths() needed.
// No island: list of links to each manual's landing page.
//
// Uses lib/zfb-registry.ts (manifests only) instead of lib/manual-registry.ts
// (which imports all 52 manuals' full pages JSON, creating a ~10MB bundle).

import { getAvailableManuals, getManifest } from '@/lib/zfb-registry';
import DefaultLayout from '../layouts/default';
import ctl from '../components/zfb/ctl';

export const meta = {
  title: 'Manual Index | Takazudo Modular',
  description: 'Browse all available translated manuals',
};

const pageStyles = ctl(`
  min-h-screen pt-[60px]
  bg-zd-gray1
  flex items-center justify-center
`);

const headingStyles = ctl(`
  text-2xl font-bold mb-vgap-md
  text-zd-white
  font-futura
`);

const listStyles = ctl(`
  list-disc list-inside
  text-lg
`);

const listItemStyles = ctl(`
  mb-vgap-xs
`);

const linkStyles = ctl(`
  text-zd-white
  zd-invert-color-link
  no-underline
  px-[4px] py-[2px]
  -mx-[4px] -my-[2px]
  rounded-xs
`);

export default function IndexPage() {
  const manualIds = getAvailableManuals();

  return (
    <DefaultLayout title="Manual Index | Takazudo Modular">
      <main className={pageStyles}>
        <div>
          <h1 className={headingStyles}>Manual Index</h1>
          <ul className={listStyles}>
            {manualIds.map((manualId) => {
              const manifest = getManifest(manualId);
              // Links use /manuals/ prefix explicitly for dynamically-built URLs.
              return (
                <li key={manualId} className={listItemStyles}>
                  <a href={`/manuals/${manualId}`} className={linkStyles}>
                    {manifest.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </DefaultLayout>
  );
}
