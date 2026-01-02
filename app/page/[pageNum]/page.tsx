import { notFound } from 'next/navigation';
import { getManualPage, getTotalPages, pageExists, getManifest } from '@/lib/manual-data';
import { PageViewer } from '@/components/page-viewer';

interface PageParams {
  pageNum: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export async function generateStaticParams() {
  const manifest = getManifest();
  const params: Array<{ pageNum: string }> = [];

  // Generate pages for all parts listed in the manifest
  for (const partInfo of manifest.parts) {
    for (let i = partInfo.pageRange[0]; i <= partInfo.pageRange[1]; i++) {
      params.push({ pageNum: i.toString() });
    }
  }

  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const pageNum = parseInt(resolvedParams.pageNum);
  const page = getManualPage(pageNum);

  if (!page) {
    return {
      title: 'Page Not Found - OXI ONE MKII Manual',
    };
  }

  return {
    title: `${page.title} (Page ${pageNum}) - OXI ONE MKII Manual`,
    description: `OXI ONE MKII Manual - Page ${pageNum}: ${page.title}`,
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const pageNum = parseInt(resolvedParams.pageNum);

  // Validate page number
  if (isNaN(pageNum) || !pageExists(pageNum)) {
    notFound();
  }

  const page = getManualPage(pageNum);
  const totalPages = getTotalPages();

  if (!page) {
    notFound();
  }

  return <PageViewer page={page} currentPage={pageNum} totalPages={totalPages} />;
}
