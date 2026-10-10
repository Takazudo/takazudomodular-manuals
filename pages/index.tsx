// pages/index.tsx — / manual index page.
// Ports app/page.tsx for the zfb renderer. Static route, no paths() needed.
// No island: list of links to each manual's landing page.
//
// Uses lib/zfb-registry.ts (manifests only) instead of lib/manual-registry.ts
// (which imports all 52 manuals' full pages JSON, creating a ~10MB bundle).

import { getAvailableManuals, getManifest } from '@/lib/zfb-registry';
import DefaultLayout from '../layouts/default';

export const meta = {
  title: 'Manual Index | Takazudo Modular',
  description: 'Browse all available translated manuals',
};

const pageStyles = `
  min-h-screen pt-[60px]
  flex items-center justify-center
`;

const headingStyles = `
  text-2xl font-bold mb-vgap-md
  text-zd-white
  font-futura
`;

const listStyles = `
  list-disc list-inside
  text-lg
`;

const listItemStyles = `
  mb-vgap-xs
`;

const linkStyles = `
  text-zd-white
  zd-invert-color-link
  no-underline
  px-[4px] py-[2px]
  -mx-[4px] -my-[2px]
  rounded-xs
`;

export default function IndexPage() {
  const manualIds = getAvailableManuals();

  return (
    <DefaultLayout title="Manual Index | Takazudo Modular">
      <main class={pageStyles}>
        <div>
          <h1 class={headingStyles}>Manual Index</h1>
          <ul class={listStyles}>
            {manualIds.map((manualId) => {
              const manifest = getManifest(manualId);
              return (
                <li class={listItemStyles}>
                  <a href={`/${manualId}`} class={linkStyles}>
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
