import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import ctl from '@netlify/classnames-template-literals';

const markdownStyles = ctl(`
  prose prose-invert max-w-none
  text-zd-white

  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-vgap-md [&_h1]:text-zd-white
  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-vgap-sm [&_h2]:mt-vgap-md [&_h2]:text-zd-white
  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-vgap-xs [&_h3]:mt-vgap-sm [&_h3]:text-zd-gray7

  [&_p]:mb-vgap-sm [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-zd-gray7

  [&_ul]:list-disc [&_ul]:ml-hgap-md [&_ul]:mb-vgap-sm
  [&_ol]:list-decimal [&_ol]:ml-hgap-md [&_ol]:mb-vgap-sm
  [&_li]:mb-vgap-xs [&_li]:text-zd-gray7

  [&_code]:bg-zd-gray2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
  [&_code]:text-zd-primary [&_code]:text-sm

  [&_pre]:bg-zd-gray2 [&_pre]:p-hgap-sm [&_pre]:rounded-md
  [&_pre]:overflow-x-auto [&_pre]:mb-vgap-sm
  [&_pre_code]:bg-transparent [&_pre_code]:p-0

  [&_blockquote]:border-l-4 [&_blockquote]:border-zd-primary
  [&_blockquote]:pl-hgap-sm [&_blockquote]:italic
  [&_blockquote]:text-zd-gray6 [&_blockquote]:mb-vgap-sm

  [&_a]:text-zd-primary [&_a]:underline [&_a]:hover:text-zd-white
  [&_a]:transition-colors

  [&_strong]:font-bold [&_strong]:text-zd-white
  [&_em]:italic
`);

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className={markdownStyles}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
