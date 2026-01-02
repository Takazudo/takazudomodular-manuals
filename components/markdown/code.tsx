import * as React from 'react';

interface CodeProps {
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
}

/**
 * Code component for markdown rendering
 * Handles both inline code and code blocks
 * Adapted from takazudomodular for manual viewer context
 */
const Code: React.FC<CodeProps> = ({ children, className, inline }) => {
  // Inline code (e.g., `code`)
  if (inline) {
    return (
      <code className="bg-zd-gray3 text-zd-primary font-mono px-[5px] py-[3px] mx-[3px] rounded">
        {children}
      </code>
    );
  }

  // Block code (inside <pre>, with syntax highlighting)
  return <code className={`font-mono text-zd-gray7 ${className || ''}`}>{children}</code>;
};

export { Code };
