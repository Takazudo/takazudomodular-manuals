import Link from 'next/link';
import ctl from '@netlify/classnames-template-literals';
import { ArrowRight } from '@/components/svg';
import { getAvailableManuals, getManifest } from '@/lib/manual-registry';
import { getManualBasePath } from '@/lib/manual-config';

const containerStyles = ctl(`
  min-h-screen pt-[60px]
  bg-zd-gray1
  flex items-center justify-center
  text-center
`);

const contentStyles = ctl(`
  max-w-3xl mx-auto
  p-hgap-lg
`);

const titleStyles = ctl(`
  text-4xl font-bold mb-vgap-lg
  text-zd-white
`);

const descriptionStyles = ctl(`
  text-lg mb-vgap-xl
  leading-relaxed
  text-zd-gray7
`);

const manualListStyles = ctl(`
  flex flex-col gap-vgap-md
  max-w-xl mx-auto
`);

const manualCardStyles = ctl(`
  bg-zd-gray2
  border border-zd-gray4
  rounded
  p-hgap-lg
  hover:bg-zd-gray3
  hover:border-zd-primary
  transition-all
  text-left
`);

const manualTitleStyles = ctl(`
  text-2xl font-bold mb-vgap-sm
  text-zd-white
  flex items-center gap-hgap-sm
`);

const manualMetaStyles = ctl(`
  text-sm text-zd-gray6
  mb-vgap-md
`);

const manualDescriptionStyles = ctl(`
  text-base text-zd-gray7
  leading-relaxed
`);

export const metadata = {
  title: 'Manual Index - PDF Translation Viewer',
  description: 'Browse all available translated manuals',
};

export default function ManualsIndexPage() {
  const manualIds = getAvailableManuals();

  return (
    <main className={containerStyles}>
      <div className={contentStyles}>
        <h1 className={titleStyles}>Available Manuals</h1>
        <p className={descriptionStyles}>
          AIによる自動翻訳で作成された日本語マニュアル一覧です。各マニュアルをクリックして閲覧できます。
        </p>

        <div className={manualListStyles}>
          {manualIds.map((manualId) => {
            const manifest = getManifest(manualId);
            return (
              <Link key={manualId} href={getManualBasePath(manualId)} className={manualCardStyles}>
                <h2 className={manualTitleStyles}>
                  <span>{manifest.title}</span>
                  <span className="ml-auto">
                    <ArrowRight
                      aria-hidden="true"
                      className="w-[20px] inline-block text-zd-primary"
                    />
                  </span>
                </h2>
                <div className={manualMetaStyles}>
                  {manifest.totalPages} pages • Japanese Translation
                </div>
                <p className={manualDescriptionStyles}>
                  AIによる自動翻訳で作成された日本語マニュアルです。キーボードの矢印キーでページ移動が可能です。
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
