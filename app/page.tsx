import Link from 'next/link';
import ctl from '@netlify/classnames-template-literals';

const containerStyles = ctl(`
  min-h-screen pt-[60px]
  bg-zd-gray1
  flex items-center justify-center
  text-center
`);

const contentStyles = ctl(`
  max-w-2xl mx-auto
  p-hgap-lg
`);

const titleStyles = ctl(`
  text-4xl font-bold mb-vgap-md
  text-zd-white
  whitespace-nowrap
`);

const descriptionStyles = ctl(`
  text-lg mb-vgap-lg
  leading-relaxed
  text-left
`);

const linkStyles = ctl(`
  text-lg
`);

export default function Home() {
  return (
    <main className={containerStyles}>
      <div className={contentStyles}>
        <h1 className={titleStyles}>
          OXI ONE MKII
          <br />
          マニュアル 日本語
        </h1>
        <p className={descriptionStyles}>
          OXI ONE
          MKIIマニュアルの日本語訳です。翻訳はAIによる自動生成で行われており、正確性を保証するものではありません。公式マニュアルの翻訳参考としてお役立てください。
        </p>
        <Link href="/page/1" className={linkStyles}>
          マニュアルを読む
        </Link>
      </div>
    </main>
  );
}
