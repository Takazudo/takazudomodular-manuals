import { notFound } from 'next/navigation';
import ctl from '@netlify/classnames-template-literals';
import { ArrowLink } from '@/components/arrow-link';
import { getPagePath, getManualAssetPath } from '@/lib/manual-config';
import { isValidManual, getAvailableManuals, getManifest } from '@/lib/manual-registry';

interface ManualLandingPageParams {
  manualId: string;
}

interface ManualLandingPageProps {
  params: Promise<ManualLandingPageParams>;
}

export async function generateStaticParams() {
  const manuals = getAvailableManuals();
  return manuals.map((manualId) => ({ manualId }));
}

export async function generateMetadata({ params }: ManualLandingPageProps) {
  const { manualId } = await params;

  if (!isValidManual(manualId)) {
    return { title: 'Manual Not Found' };
  }

  const manifest = getManifest(manualId);
  return {
    title: `${manifest.title} 日本語訳 | Takazudo Modular`,
    description: `Takazudo Modularによる${manifest.title}の日本語訳マニュアル`,
  };
}

const pageStyles = ctl(`
  min-h-screen pt-[60px]
  bg-zd-gray1
  flex items-center justify-center
`);

const headingStyles = ctl(`
  pb-vgap-lg
  font-futura
`);

const brandStyles = ctl(`
  block text-4xl pb-vgap-sm
`);

const titleStyles = ctl(`
  block text-5xl
`);

const subtitleStyles = ctl(`
  block text-3xl pt-vgap-sm
`);

const navStyles = ctl(`
  flex flex-col gap-vgap-sm
`);

const footerStyles = ctl(`
  text-lg pt-vgap-md
  leading-relaxed
  font-futura
  border-t border-zd-white
  mt-vgap-lg
  flex justify-between
`);

const codeStyles = ctl(`
  inline-block
  font-mono bg-zd-gray2 px-[.5em] py-[.1em] rounded
  leading-snug
  border border-zd-white
`);

/** Format YYYYMMDD to YYYY/MM/DD */
function formatUpdatedAt(dateStr: string | undefined): string {
  if (!dateStr || dateStr.length !== 8) {
    return '';
  }
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${year}/${month}/${day}`;
}

export default async function ManualLandingPage({ params }: ManualLandingPageProps) {
  const { manualId } = await params;

  if (!isValidManual(manualId)) {
    notFound();
  }

  const manifest = getManifest(manualId);

  return (
    <main className={pageStyles}>
      <div className="lg:-mx-hgap-2xl">
        <h1 className={headingStyles}>
          <span className={brandStyles}>{manifest.brand}:</span>
          <span className={titleStyles}>{manifest.title}</span>
          <span className={subtitleStyles}>Japanese Translation（日本語訳）</span>
        </h1>

        <nav className={navStyles}>
          <ArrowLink href={getPagePath(manualId, 1)}>日本語訳付きマニュアルを読む</ArrowLink>
          <ArrowLink href={getManualAssetPath(manualId, 'original.pdf')} external>
            英語版オリジナル（PDF）
          </ArrowLink>
        </nav>

        <p className={footerStyles}>
          <span>
            Navigation: <code className={codeStyles}>←</code> <code className={codeStyles}>→</code>{' '}
            key
          </span>
          {manifest.updatedAt && <span>Updated: {formatUpdatedAt(manifest.updatedAt)}</span>}
        </p>
      </div>
    </main>
  );
}
