import Image from 'next/image';
import ctl from '@netlify/classnames-template-literals';
import type { ManualPage } from '@/lib/types/manual';
import { MarkdownRenderer } from './markdown-renderer';
import { PageNavigation } from './page-navigation';
import { KeyboardNavigation } from './keyboard-navigation';
import { withBasePath } from '@/lib/asset-url';

const containerStyles = ctl(`
  flex flex-col lg:flex-row
  h-screen
  pt-[60px]
`);

const columnStyles = ctl(`
  flex-1
  overflow-y-scroll
  min-h-0
`);

const imageColumnStyles = ctl(`
  ${columnStyles}
  flex flex-col items-center
  bg-zd-white
`);

const contentColumnStyles = ctl(`
  ${columnStyles}
  bg-zd-gray2
  px-hgap-sm
`);

const imageWrapperStyles = ctl(`
  relative w-full
  bg-zd-gray2
  rounded-md
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
`);

interface PageViewerProps {
  page: ManualPage;
  currentPage: number;
  totalPages: number;
}

export function PageViewer({ page, currentPage, totalPages }: PageViewerProps) {
  return (
    <>
      <KeyboardNavigation currentPage={currentPage} totalPages={totalPages} />
      <div className={containerStyles}>
        {/* Left Column: PDF Image */}
        <div className={imageColumnStyles}>
          <div className={imageWrapperStyles}>
            <Image
              src={withBasePath(page.image)}
              alt={`Page ${currentPage}: ${page.title}`}
              width={1200}
              height={1600}
              className="w-full h-auto"
              priority={currentPage === 1}
            />
          </div>
        </div>

        {/* Right Column: Translation */}
        <div className={contentColumnStyles}>
          <div className={navigationWrapperStyles}>
            <PageNavigation currentPage={currentPage} totalPages={totalPages} />
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
    </>
  );
}
