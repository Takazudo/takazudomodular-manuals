import { notFound } from 'next/navigation';
import {
  getManualPage,
  getAllPages,
  getTotalPages,
  pageExists,
  getAllPageNumbers,
  getManifest,
} from '@/lib/manual-data';
import { isValidManual, getAvailableManuals, hasLanguage } from '@/lib/manual-registry';
import { ManualViewer } from '@/components/viewer/manual-viewer';

interface PageParams {
  manualId: string;
  pageNum: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export async function generateStaticParams() {
  const manuals = getAvailableManuals();
  const params: Array<{ manualId: string; pageNum: string }> = [];

  // Generate pages for all manuals
  for (const manualId of manuals) {
    const pageNumbers = getAllPageNumbers(manualId);
    for (const { pageNum } of pageNumbers) {
      params.push({ manualId, pageNum });
    }
  }

  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const { manualId, pageNum: pageNumStr } = resolvedParams;
  const pageNum = Number(pageNumStr);

  // Validate manual ID
  if (!isValidManual(manualId)) {
    return {
      title: 'Manual Not Found',
    };
  }

  const manifest = getManifest(manualId);

  // Validate page number is a positive integer
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return {
      title: `Page Not Found - ${manifest.title}`,
    };
  }

  // Metadata is JA-only — matches first SSR paint and avoids needing to
  // resolve the active UI language on the server for a static export.
  const page = getManualPage(manualId, pageNum);

  if (!page) {
    return {
      title: `Page Not Found - ${manifest.title}`,
    };
  }

  return {
    title: `${page.title} (Page ${pageNum}) - ${manifest.title}`,
    description: `${manifest.title} - Page ${pageNum}: ${page.title}`,
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const { manualId, pageNum: pageNumStr } = resolvedParams;
  const pageNum = Number(pageNumStr);

  // Validate manual ID
  if (!isValidManual(manualId)) {
    notFound();
  }

  // Page-count / page-existence validation stays JA-driven. EN pages mirror
  // the same PDF layout so page numbers align.
  if (!Number.isInteger(pageNum) || pageNum < 1 || !pageExists(manualId, pageNum)) {
    notFound();
  }

  const allPagesJa = getAllPages(manualId, 'ja');
  const allPagesEn = hasLanguage(manualId, 'en') ? getAllPages(manualId, 'en') : undefined;
  const totalPages = getTotalPages(manualId);

  // Defensive check: JA must contain the requested page (already verified by
  // pageExists, but guard against data/manifest drift).
  if (!allPagesJa.some((p) => p.pageNum === pageNum)) {
    notFound();
  }

  return (
    <ManualViewer
      allPagesJa={allPagesJa}
      allPagesEn={allPagesEn}
      currentPage={pageNum}
      totalPages={totalPages}
      manualId={manualId}
    />
  );
}
