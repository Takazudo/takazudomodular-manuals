/**
 * Local re-implementation of `@netlify/classnames-template-literals`.
 *
 * Why local: the npm package ships CJS-first (`main` field, no `exports`
 * map). zfb's islands bundler runs esbuild in the "neutral" platform, which
 * does not read `main`/`module` and so cannot resolve the bare specifier —
 * `zfb build` fails with "Could not resolve". The helper is a one-liner
 * (collapse whitespace, drop stray `false`/`true`/`undefined` tokens), so
 * inlining it is cheaper and safer than wiring bundler mainFields/alias config.
 *
 * Behavior is byte-for-byte identical to the upstream `esm.js` build.
 */
export default function ctl(template: string): string {
  const trimmed = template.replace(/\s+/gm, ' ');
  return trimmed
    .split(' ')
    .filter((c) => c !== 'false' && c !== 'true' && c !== 'undefined')
    .join(' ')
    .trim();
}
