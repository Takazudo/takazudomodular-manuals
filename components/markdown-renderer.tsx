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
  Ul,
  Ol,
  Table,
  Hr,
} from '@/components/markdown';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug, rehypeHighlight]}
      components={{
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
        ul: Ul,
        ol: Ol,
        table: Table,
        hr: Hr,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
