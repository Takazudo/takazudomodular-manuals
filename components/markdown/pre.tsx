import * as React from 'react';
import ctl from '@netlify/classnames-template-literals';

interface PreProps {
  children?: React.ReactNode;
}

/**
 * Pre component for code blocks
 * Provides proper styling and scrolling for multi-line code
 * Adapted from takazudomodular for manual viewer context
 */
const Pre: React.FC<PreProps> = ({ children }) => {
  return (
    <pre
      className={ctl(`
        bg-zd-gray3
        p-hgap-sm
        rounded-md
        overflow-x-auto
        mb-vgap-md
      `)}
    >
      {children}
    </pre>
  );
};

export { Pre };
