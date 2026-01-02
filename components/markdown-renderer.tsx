import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
  Strong,
  Em,
  A,
  Code,
  Pre,
  Blockquote,
  Ul,
  Ol,
  Table,
  Hr,
} from '@/components/markdown';

interface MarkdownRendererProps {
  content: string;
}

// Memoized components object to prevent recreation on every render
const markdownComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: P,
  strong: Strong,
  em: Em,
  a: A,
  code: Code,
  pre: Pre,
  blockquote: Blockquote,
  ul: Ul,
  ol: Ol,
  table: Table,
  hr: Hr,
} as const;

// Memoized plugins to prevent recreation on every render
const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeSlug, rehypeHighlight];

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
});
