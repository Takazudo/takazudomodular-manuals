import { redirect } from 'next/navigation';

export default function Part01Page() {
  // Redirect old part-based URL to new continuous page structure
  redirect('/page/1');
}
