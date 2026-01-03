import Link from 'next/link';
import ctl from '@netlify/classnames-template-literals';
import { ArrowRight } from '@/components/svg';

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
  inline-flex items-center
  text-lg
  zd-invert-color-link
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
          MKIIマニュアルの日本語訳です。翻訳はAIによる自動生成で行われており、正確性を保証するものではありません。
          <Link href="https://drive.google.com/file/d/1LdJvG-GqzzKI2qw92CyZKklE7kSoZLFE/view">
            公式マニュアル
          </Link>
          の翻訳参考としてお役立てください。
        </p>
        <Link href="/page/1" className={linkStyles}>
          <span className="pr-[7px]">
            <ArrowRight aria-hidden="true" className="w-[18px] md:w-[24px]" />
          </span>
          <span>マニュアルを読む</span>
        </Link>
      </div>
    </main>
  );
}
