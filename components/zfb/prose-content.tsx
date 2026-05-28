import type { ManualPage } from '@/lib/types/manual';
import { EMPTY_CONTENT_MESSAGE, type Lang } from './lang';

interface ProseContentProps {
  page: ManualPage;
  /** Display language — drives the `lang` attribute and empty-state copy. */
  lang: Lang;
  /** data-testid forwarded to the rendered container, matching the Next.js viewer. */
  testId?: string;
  emptyTestId?: string;
}

/**
 * Renders a page's translated content. Replaces the deleted `MarkdownRenderer`
 * concept: instead of parsing markdown in the browser (react-markdown), the
 * build step (`scripts/pdf-md-to-html.js`) pre-renders `content` → `contentHtml`
 * with hljs highlight classes + `.table-wrapper`-wrapped tables. We inject that
 * HTML directly.
 *
 * The injected HTML carries per-element prose styling that #128's CSS scopes
 * under `.zd-prose` — and #129 deliberately does NOT bake the outer `.zd-prose`
 * wrapper into `contentHtml`. So this container adds `className="zd-prose"` (the
 * verified prose-CSS contract). Zero markdown JS ships to the client.
 */
export function ProseContent({
  page,
  lang,
  testId = 'translation-panel',
  emptyTestId = 'no-translation-message',
}: ProseContentProps) {
  if (page.hasContent && page.contentHtml) {
    return (
      <div
        lang={lang}
        className="zd-prose"
        data-testid={testId}
        dangerouslySetInnerHTML={{ __html: page.contentHtml }}
      />
    );
  }
  return (
    <p lang={lang} className="text-zd-gray6 italic" data-testid={emptyTestId}>
      {EMPTY_CONTENT_MESSAGE[lang]}
    </p>
  );
}
