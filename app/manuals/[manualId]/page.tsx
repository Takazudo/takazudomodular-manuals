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
  text-center
`);

const contentStyles = ctl(`
  max-w-2xl mx-auto
  p-hgap-lg
`);

const titleStyles = ctl(`
  text-4xl font-bold mb-vgap-md
  text-zd-white
  whitespace-nowrap
`);

const descriptionStyles = ctl(`
  text-lg mb-vgap-lg
  leading-relaxed
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
    title: `${manifest.title} - 日本語訳`,
    description: `${manifest.title}の日本語訳マニュアル`,
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
        <h1 className={titleStyles}>
          {manifest.title}
          <br />
          マニュアル 日本語訳
        </h1>
        <p className={descriptionStyles}>
          {manifest.title}
          マニュアルの日本語訳です。翻訳はAIによる自動生成で行われており、正確性を保証するものではありません。
          <Link href="https://drive.google.com/file/d/1LdJvG-GqzzKI2qw92CyZKklE7kSoZLFE/view">
            公式マニュアル
          </Link>
          の翻訳参考としてお役立てください。ページは <code className={codeStyles}>←</code>{' '}
          <code className={codeStyles}>→</code> キーで移動可能です。
        </p>
        <Link href={getPagePath(manualId, 1)} className={linkStyles}>
          <span className="pr-[7px]">
            <ArrowRight
              aria-hidden="true"
              className="w-[18px] md:w-[24px] align-middle inline-block"
            />
          </span>
          <span>マニュアルを読む</span>
        </Link>
      </div>
    </main>
  );
}
