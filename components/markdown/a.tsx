import * as React from 'react';
import Link from 'next/link';

interface AProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children?: React.ReactNode;
  href?: string;
}

/**
 * Link component for markdown rendering
 * Adapted from takazudomodular for manual viewer context
 * Uses Next.js Link for internal navigation, regular anchor for external links
 */
const A: React.FC<AProps> = ({ children, href = '', className, ...props }) => {
  // Security: Detect unsafe protocols
  const isUnsafe = /^javascript:/i.test(href);

  // Protocol detection
  const isExternal = /^(https?:)?\/\//i.test(href);
  const isSpecialScheme = /^(mailto:|tel:|ftp:)/i.test(href);
  const isAnchor = href.startsWith('#');

  const linkClassName = className
    ? `text-zd-primary underline hover:text-zd-white transition-colors ${className}`
    : 'text-zd-primary underline hover:text-zd-white transition-colors';

  // Block unsafe protocols (XSS prevention)
  if (!href || isUnsafe) {
    return <span className={linkClassName}>{children}</span>;
  }

  // External links, anchors, or special schemes use regular <a> tag
  if (isExternal || isAnchor || isSpecialScheme) {
    return (
      <a
        href={href}
        className={linkClassName}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  // Internal links use Next.js Link
  return (
    <Link href={href} className={linkClassName} {...props}>
      {children}
    </Link>
  );
};

export { A };
