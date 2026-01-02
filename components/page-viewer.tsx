import Image from 'next/image';
import ctl from '@netlify/classnames-template-literals';
import type { ManualPage } from '@/lib/types/manual';
import { MarkdownRenderer } from './markdown-renderer';
import { PageNavigation } from './page-navigation';

const containerStyles = ctl(`
  flex flex-col lg:flex-row
  gap-hgap-md
  h-[calc(100vh-60px)]
  pt-[60px]
`);

const columnStyles = ctl(`
  flex-1
  overflow-y-auto
  p-hgap-md
`);

const imageColumnStyles = ctl(`
  ${columnStyles}
  bg-zd-gray1
  flex flex-col items-center
`);

const contentColumnStyles = ctl(`
  ${columnStyles}
  bg-zd-gray2
`);

const imageWrapperStyles = ctl(`
  relative w-full max-w-2xl
  bg-zd-gray2
  rounded-md
  overflow-hidden
  border border-zd-gray3
`);

const navigationWrapperStyles = ctl(`
  sticky top-0 z-10
  mb-vgap-md
  bg-zd-gray2
  pt-vgap-sm
`);

const pageTitleStyles = ctl(`
  text-xl font-bold
  text-zd-white
  mb-vgap-sm
  pb-vgap-sm
  border-b border-zd-gray3
`);

interface PageViewerProps {
  page: ManualPage;
  partNum: string;
  totalPages: number;
}

export function PageViewer({ page, partNum, totalPages }: PageViewerProps) {
  return (
    <div className={containerStyles}>
      {/* Left Column: PDF Image */}
      <div className={imageColumnStyles}>
        <div className={imageWrapperStyles}>
          <Image
            src={page.image}
            alt={`Page ${page.pageNum}: ${page.title}`}
            width={1200}
            height={1600}
            className="w-full h-auto"
            priority={page.pageNum === 1}
          />
        </div>
      </div>

      {/* Right Column: Translation */}
      <div className={contentColumnStyles}>
        <div className={navigationWrapperStyles}>
          <PageNavigation partNum={partNum} currentPage={page.pageNum} totalPages={totalPages} />
        </div>

        <div className={pageTitleStyles}>
          {page.title}
          {page.sectionName && (
            <span className="text-sm text-zd-gray6 ml-hgap-sm">({page.sectionName})</span>
          )}
        </div>

        {page.hasContent ? (
          <MarkdownRenderer content={page.translation} />
        ) : (
          <p className="text-zd-gray6 italic">このページには翻訳がありません</p>
        )}
      </div>
    </div>
  );
}
