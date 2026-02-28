import React, { type ReactNode, Component } from 'react';
import OriginalMDXContent from '@theme-original/MDXContent';
import type MDXContentType from '@theme/MDXContent';
import type { WrapperProps } from '@docusaurus/types';
import { useDoc } from '@docusaurus/plugin-content-docs/client';

type Props = WrapperProps<typeof MDXContentType>;

/**
 * Error boundary to safely render DocMetaInner.
 * useDoc() throws when not in a doc context (e.g., standalone pages).
 * This boundary catches that error and renders nothing.
 */
class MetaErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function formatTimestamp(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/**
 * Renders creation date, last updated, and author metadata under h1.
 * Positioned via CSS flexbox ordering in custom.css (.theme-doc-meta).
 */
function DocMetaInner(): ReactNode {
  const { metadata, frontMatter } = useDoc();

  const creationDate = frontMatter.custom_creation_date as string | undefined;
  const lastUpdatedAt = metadata.lastUpdatedAt;
  const lastUpdatedBy = metadata.lastUpdatedBy;

  if (!creationDate && !lastUpdatedAt) {
    return null;
  }

  return (
    <div className="theme-doc-meta">
      {creationDate && (
        <div className="theme-doc-meta-created">
          <span>Created:</span> {creationDate}
        </div>
      )}
      {lastUpdatedAt && (
        <div className="theme-doc-meta-updated">
          <span>Updated:</span> {formatTimestamp(lastUpdatedAt)}
        </div>
      )}
      {lastUpdatedBy && (
        <div className="theme-doc-meta-author">
          <span>Author:</span> <address>{lastUpdatedBy}</address>
        </div>
      )}
    </div>
  );
}

/**
 * Swizzled MDXContent wrapper that injects document metadata.
 * The metadata element is rendered as a sibling inside .markdown,
 * positioned after h1 via CSS order: -1.
 */
export default function MDXContentWrapper(props: Props): ReactNode {
  return (
    <>
      <MetaErrorBoundary>
        <DocMetaInner />
      </MetaErrorBoundary>
      <OriginalMDXContent {...props} />
    </>
  );
}
