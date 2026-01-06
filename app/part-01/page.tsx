import { redirect } from 'next/navigation';
import { getPagePath } from '@/lib/manual-config';

export default function Part01Page() {
  // Redirect old part-based URL to new continuous page structure
  // Hardcoded to oxi-one-mk2 as this is a legacy redirect
  redirect(getPagePath('oxi-one-mk2', 1));
}
