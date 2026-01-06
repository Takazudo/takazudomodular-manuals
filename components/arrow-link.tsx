import Link from 'next/link';
import ctl from '@netlify/classnames-template-literals';
import { ArrowRight } from '@/components/svg';

const linkStyles = ctl(`
  inline-flex items-center
  text-xl
  zd-invert-color-link
  underline
`);

const arrowStyles = ctl(`
  w-[18px] md:w-[24px]
  align-baseline inline-block
  relative top-px
`);

interface ArrowLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

export function ArrowLink({ href, children, external }: ArrowLinkProps) {
  const content = (
    <>
      <span className="pr-[12px]">
        <ArrowRight aria-hidden="true" className={arrowStyles} />
      </span>
      <span>{children}</span>
    </>
  );

  if (external) {
    return (
      <span className="inline-block">
        <a href={href} className={linkStyles} target="_blank" rel="noopener">
          {content}
        </a>
      </span>
    );
  }

  return (
    <span className="inline-block">
      <Link href={href} className={linkStyles}>
        {content}
      </Link>
    </span>
  );
}
