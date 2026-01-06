import { notFound } from 'next/navigation';
import Link from 'next/link';
import ctl from '@netlify/classnames-template-literals';
import { ArrowRight } from '@/components/svg';
import { getPagePath } from '@/lib/manual-config';
import { isValidManual, getAvailableManuals, getManifest } from '@/lib/manual-registry';

const containerStyles = ctl(`
  min-h-screen pt-[60px]
  bg-zd-gray1
  flex items-center justify-center
`);

const contentStyles = ctl(`
  text-left
`);

const descriptionStyles = ctl(`
  text-lg pt-vgap-md
  leading-relaxed
  font-futura
  border-t border-zd-white
  mt-vgap-lg
`);

const linkStyles = ctl(`
  inline-flex items-center
  text-xl
  zd-invert-color-link
`);

const codeStyles = ctl(`
  inline-block
  font-mono bg-zd-gray2 px-[.5em] py-[.1em] rounded
  leading-snug
  border border-zd-white
`);

interface ManualIndexPageParams {
  manualId: string;
}

interface ManualIndexPageProps {
  params: Promise<ManualIndexPageParams>;
}

export async function generateStaticParams() {
  const manuals = getAvailableManuals();
  return manuals.map((manualId) => ({
    manualId,
  }));
}

export async function generateMetadata({ params }: ManualIndexPageProps) {
  const resolvedParams = await params;
  const { manualId } = resolvedParams;

  if (!isValidManual(manualId)) {
    return {
      title: 'Manual Not Found',
    };
  }

  const manifest = getManifest(manualId);

  return {
    title: `${manifest.title} 日本語訳`,
    description: `Takazudo Modularによる${manifest.title}の日本語訳マニュアル`,
  };
}

export default async function ManualIndexPage({ params }: ManualIndexPageProps) {
  const resolvedParams = await params;
  const { manualId } = resolvedParams;

  // Validate manual ID
  if (!isValidManual(manualId)) {
    notFound();
  }

  const manifest = getManifest(manualId);

  return (
    <main className={containerStyles}>
      <div className={contentStyles}>
        <h1 className="pb-vgap-lg font-futura">
          <span className="block text-4xl pb-vgap-sm">ADDAC System:</span>
          <span className="block text-5xl">{manifest.title}</span>
          <span className="block text-3xl pt-vgap-sm">Japanese Translation（日本語訳）</span>
        </h1>
        <div>
          <Link href={getPagePath(manualId, 1)} className={linkStyles}>
            <span className="pr-[7px]">
              <ArrowRight
                aria-hidden="true"
                className="w-[18px] md:w-[24px] align-middle inline-block"
              />
            </span>
            <span>日本語訳マニュアルを読む</span>
          </Link>
        </div>
        <div className="pt-vgap-sm">
          <Link href={getPagePath(manualId, 1)} className={linkStyles}>
            <span className="pr-[7px]">
              <ArrowRight
                aria-hidden="true"
                className="w-[18px] md:w-[24px] align-middle inline-block"
              />
            </span>
            <span>英語版オリジナル</span>
          </Link>
        </div>

        <p className={descriptionStyles}>
          Navigation: <code className={codeStyles}>←</code> <code className={codeStyles}>→</code>{' '}
          key
        </p>
      </div>
    </main>
  );
}
