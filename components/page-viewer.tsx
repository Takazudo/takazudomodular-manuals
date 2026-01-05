'use client';

import { useState, useEffect, useRef } from 'react';
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
  px-hgap-sm
`);

const imageWrapperStyles = ctl(`
  relative w-full
  min-h-[400px]
  h-full
  content-center
`);

const loaderWrapperStyles = ctl(`
  absolute
  top-1/2 left-1/2
  transform -translate-x-1/2 -translate-y-1/2
  z-10
`);

const navigationWrapperStyles = ctl(`
  sticky top-0 z-10
  mb-vgap-md
  pt-vgap-sm
  px-hgap-sm
  -mx-hgap-sm
  bg-zd-black/90
`);

interface PageViewerProps {
  page: ManualPage;
  currentPage: number;
  totalPages: number;
  manualId: string;
}

export function PageViewer({ page, currentPage, totalPages, manualId }: PageViewerProps) {
  // Start with false - on static pages, image is already in HTML and visible
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  // Track if we should animate (only after client-side navigation)
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevPageRef = useRef({ currentPage, manualId });

  // Only show loading state when navigating to a different page (client-side navigation)
  useEffect(() => {
    const prevPage = prevPageRef.current;
    if (prevPage.currentPage !== currentPage || prevPage.manualId !== manualId) {
      setIsLoading(true);
      setShouldAnimate(true);
      setHasError(false);
    }
    prevPageRef.current = { currentPage, manualId };
  }, [currentPage, manualId]);

  // Determine image class: no animation on initial load, fade-in after navigation
  const getImageClassName = () => {
    if (isLoading) return 'opacity-0';
    if (shouldAnimate) return 'page-image-fade-in';
    return ''; // No animation on initial load
  };

  return (
    <>
      <KeyboardNavigation currentPage={currentPage} totalPages={totalPages} manualId={manualId} />
      <div className={containerStyles}>
        {/* Left Column: PDF Image */}
        <div className={imageColumnStyles} data-testid="page-image-column">
          <div className={imageWrapperStyles} data-testid="page-image-wrapper">
            {isLoading && !hasError && (
              <div className={loaderWrapperStyles}>
                <div className="page-image-loader" />
              </div>
            )}
            {hasError ? (
              <div className={loaderWrapperStyles} data-testid="page-image-error">
                <div className="text-zd-red text-center">
                  <p className="text-lg font-bold mb-vgap-xs">画像の読み込みに失敗しました</p>
                  <p className="text-sm text-zd-gray6">ページ {currentPage}</p>
                </div>
              </div>
            ) : !page.image ? (
              <div className={loaderWrapperStyles} data-testid="page-image-missing">
                <div className="text-zd-gray6 text-center">
                  <p className="text-lg mb-vgap-xs">画像がありません</p>
                  <p className="text-sm">ページ {currentPage}</p>
                </div>
              </div>
            ) : (
              <Image
                src={withBasePath(page.image)}
                alt={`Page ${currentPage}: ${page.title}`}
                width={1200}
                height={1600}
                className={`w-full h-auto ${getImageClassName()}`}
                priority={currentPage === 1}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                data-testid="page-image"
              />
            )}
          </div>
        </div>

        {/* Right Column: Translation */}
        <div className={contentColumnStyles} data-testid="translation-column">
          <div className={navigationWrapperStyles} data-testid="page-navigation-wrapper">
            <PageNavigation currentPage={currentPage} totalPages={totalPages} manualId={manualId} />
          </div>

          {page.hasContent ? (
            <div data-testid="translation-panel">
              <MarkdownRenderer content={page.translation} />
            </div>
          ) : (
            <p className="text-zd-gray6 italic" data-testid="no-translation-message">
              このページには翻訳がありません
            </p>
          )}
        </div>
      </div>
    </>
  );
}
