import type { ReactNode } from 'react';
import React from 'react';

/**
 * Escape a string so it can be safely used inside a RegExp literal.
 */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split the query into non-empty whitespace-separated terms.
 */
function splitTerms(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Wrap all occurrences of any query term in `text` with <mark> elements.
 * Matching is case-insensitive and literal (not fuzzy).
 * Returns a flat list of React nodes suitable for rendering as children.
 */
export function highlightTerms(text: string, query: string): ReactNode[] {
  const terms = splitTerms(query);
  if (terms.length === 0 || text.length === 0) {
    return [text];
  }

  const pattern = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'gi');
  const parts = text.split(pattern);
  const nodes: ReactNode[] = [];

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!part) continue;
    // Odd indices are the captured matches thanks to the capturing group.
    if (i % 2 === 1) {
      nodes.push(React.createElement('mark', { key: `m-${i}` }, part));
    } else {
      nodes.push(part);
    }
  }

  return nodes;
}

/**
 * Build a short excerpt of `body`, centered around the first match of any
 * query term when possible. Keeps output <= maxLen characters (with ellipses
 * counted). If no term matches, returns the leading slice.
 */
export function makeExcerpt(body: string, query: string, maxLen = 160): string {
  const text = (body ?? '').replace(/\s+/g, ' ').trim();
  if (text.length === 0) return '';
  if (text.length <= maxLen) return text;

  const terms = splitTerms(query);
  if (terms.length === 0) {
    return `${text.slice(0, maxLen - 1).trimEnd()}…`;
  }

  const pattern = new RegExp(terms.map(escapeRegex).join('|'), 'i');
  const match = pattern.exec(text);
  if (!match) {
    return `${text.slice(0, maxLen - 1).trimEnd()}…`;
  }

  const matchIdx = match.index;
  const halfWindow = Math.floor(maxLen / 2);
  let start = Math.max(0, matchIdx - halfWindow);
  const end = Math.min(text.length, start + maxLen);
  // Re-pin start so window stays maxLen wide when we hit the right edge.
  start = Math.max(0, end - maxLen);

  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return prefix + text.slice(start, end).trim() + suffix;
}
