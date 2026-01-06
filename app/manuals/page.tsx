import Link from 'next/link';
import ctl from '@netlify/classnames-template-literals';
import { getAvailableManuals, getManifest } from '@/lib/manual-registry';
import { getManualBasePath } from '@/lib/manual-config';

export const metadata = {
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

export default function ManualsIndexPage() {
  const manualIds = getAvailableManuals();

  return (
    <main className={pageStyles}>
      <div>
        <h1 className={headingStyles}>Manual Index</h1>
        <ul className={listStyles}>
          {manualIds.map((manualId) => {
            const manifest = getManifest(manualId);
            return (
              <li key={manualId} className={listItemStyles}>
                <Link href={getManualBasePath(manualId)} className={linkStyles}>
                  {manifest.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
