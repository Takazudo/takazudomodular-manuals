import * as React from 'react';
import ctl from '@netlify/classnames-template-literals';

interface H1Props {
  children?: React.ReactNode;
  id?: string;
}

/**
 * H1 heading component for markdown rendering
 * Adapted from takazudomodular for manual viewer context
 */
const H1: React.FC<H1Props> = ({ children, id }) => {
  return (
    <h1
      id={id}
      className={ctl(`
        text-2xl md:text-3xl lg:text-4xl
        font-bold
        text-zd-white
        mb-vgap-md
        pb-vgap-sm
        border-b-4 border-zd-white
      `)}
    >
      {children}
    </h1>
  );
};

export { H1 };
