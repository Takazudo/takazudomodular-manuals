import { redirect } from 'next/navigation';
import { getPagePath } from '@/lib/manual-config';
import { getAllPageNumbers } from '@/lib/manual-data';

interface PageParams {
  pageNum: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export async function generateStaticParams() {
  return getAllPageNumbers('oxi-one-mk2');
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const pageNum = Number(resolvedParams.pageNum);

  // Redirect old page route to new manual-specific route
  // Hardcoded to oxi-one-mk2 as this is a legacy redirect
  redirect(getPagePath('oxi-one-mk2', pageNum));
}
