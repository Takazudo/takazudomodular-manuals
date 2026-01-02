import Link from 'next/link';
import ctl from '@netlify/classnames-template-literals';

const headerStyles = ctl(`
  fixed top-0 left-0 right-0 z-50
  bg-zd-gray1
  border-b border-zd-gray3
  px-hgap-md py-vgap-sm
  flex items-center justify-between
`);

const titleStyles = ctl(`
  text-lg font-bold
  text-zd-white
  hover:text-zd-primary
  transition-colors
`);

const navLinkStyles = ctl(`
  text-sm
  text-zd-gray6
  hover:text-zd-white
  transition-colors
  underline
`);

export function Header() {
  return (
    <header className={headerStyles}>
      <Link href="/" className={titleStyles}>
        OXI ONE MKII Manual
      </Link>
      <a
        href="https://takazudomodular.com"
        target="_blank"
        rel="noopener noreferrer"
        className={navLinkStyles}
      >
        Takazudo Modular
      </a>
    </header>
  );
}
