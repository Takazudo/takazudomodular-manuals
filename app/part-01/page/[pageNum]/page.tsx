import { notFound } from 'next/navigation';
import { getManualPart, getManualPage } from '@/lib/manual-data';
import { PageViewer } from '@/components/page-viewer';

interface PageParams {
  pageNum: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export async function generateStaticParams() {
  const part = getManualPart('01');
  return part.pages.map((page) => ({
    pageNum: page.pageNum.toString(),
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const pageNum = parseInt(resolvedParams.pageNum);
  const page = getManualPage('01', pageNum);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: `${page.title} - OXI ONE MKII Manual Part 01`,
    description: `OXI ONE MKII Manual - Part 01, Page ${pageNum}: ${page.title}`,
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const pageNum = parseInt(resolvedParams.pageNum);
  const page = getManualPage('01', pageNum);
  const part = getManualPart('01');

  if (!page) {
    notFound();
  }

  return <PageViewer page={page} partNum="01" totalPages={part.totalPages} />;
}
