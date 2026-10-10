import { computed, Show, type ReadonlySignal } from '@takazudo/zfb/zudo-react';
import type { ManualPage } from '@/lib/types/manual';
import { EMPTY_CONTENT_MESSAGE, type Lang } from './lang';

interface ProseContentProps {
  page: ReadonlySignal<ManualPage>;
  lang: ReadonlySignal<Lang>;
  testId?: string;
  emptyTestId?: string;
}

/** Build-generated HTML is opaque to hydration; the wrapper owns prose styling. */
export function ProseContent({
  page,
  lang,
  testId = 'translation-panel',
  emptyTestId = 'no-translation-message',
}: ProseContentProps) {
  return (
    <Show
      when={computed(() => !!(page.value.hasContent && page.value.contentHtml))}
      fallback={() => (
        <p lang={lang} class="text-zd-gray6 italic" data-testid={emptyTestId}>
          {computed(() => EMPTY_CONTENT_MESSAGE[lang.value])}
        </p>
      )}
    >
      {() => (
        <div
          lang={lang}
          class="zd-prose"
          data-testid={testId}
          rawHtml={computed(() => page.value.contentHtml ?? '')}
        />
      )}
    </Show>
  );
}
