import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';

const notoSans = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'OXI ONE MKII Manual',
  description: 'OXI ONE MKII Hardware Synthesizer Manual - Japanese Translation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={notoSans.variable}>
        <Header />
        {children}
      </body>
    </html>
  );
}
