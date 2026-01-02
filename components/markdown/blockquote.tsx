import * as React from 'react';
import ctl from '@netlify/classnames-template-literals';

interface BlockquoteProps {
  children?: React.ReactNode;
}

/**
 * Blockquote component for markdown rendering
 * Adapted from previous prose styling for manual viewer context
 */
const Blockquote: React.FC<BlockquoteProps> = ({ children }) => {
  return (
    <blockquote
      className={ctl(`
        border-l-4 border-zd-primary
        pl-hgap-sm
        italic
        text-zd-gray6
        mb-vgap-sm
      `)}
    >
      {children}
    </blockquote>
  );
};

export { Blockquote };
