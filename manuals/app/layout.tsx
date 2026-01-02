import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OXI ONE MKII Manual',
  description: 'OXI ONE MKII Hardware Synthesizer Manual - Japanese Translation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
