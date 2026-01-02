import Link from 'next/link';
import ctl from '@netlify/classnames-template-literals';

const containerStyles = ctl(`
  min-h-screen pt-[60px]
  bg-zd-gray1
  flex items-center justify-center
`);

const contentStyles = ctl(`
  max-w-2xl mx-auto
  p-hgap-lg
`);

const titleStyles = ctl(`
  text-4xl font-bold mb-vgap-md
  text-zd-white
`);

const descriptionStyles = ctl(`
  text-lg mb-vgap-lg
  text-zd-gray7
  leading-relaxed
`);

const partCardStyles = ctl(`
  bg-zd-gray2 border border-zd-gray3
  rounded-md p-hgap-md
  hover:border-zd-primary
  transition-colors
`);

const partTitleStyles = ctl(`
  text-xl font-semibold mb-vgap-sm
  text-zd-white
`);

const partDescStyles = ctl(`
  text-base text-zd-gray6
  mb-vgap-sm
`);

const linkStyles = ctl(`
  inline-block
  px-hgap-md py-vgap-sm
  bg-zd-primary hover:bg-zd-primary-hover
  text-zd-white text-sm font-medium
  rounded
  transition-colors
`);

export default function Home() {
  return (
    <main className={containerStyles}>
      <div className={contentStyles}>
        <h1 className={titleStyles}>OXI ONE MKII マニュアル</h1>

        <p className={descriptionStyles}>
          OXI ONE
          MKIIは、MIDIシーケンサー、CVシーケンサー、パフォーマンスコントローラーを一体化した強力なハードウェアシーケンサーです。
          このマニュアルでは、全機能について日本語で詳しく解説しています。
        </p>

        <div className={partCardStyles}>
          <h2 className={partTitleStyles}>Part 01: 基礎編</h2>
          <p className={partDescStyles}>
            製品概要、セットアップ、基本操作について学びます。
            <br />
            全30ページ
          </p>
          <Link href="/part-01" className={linkStyles}>
            Part 01を開く →
          </Link>
        </div>
      </div>
    </main>
  );
}
