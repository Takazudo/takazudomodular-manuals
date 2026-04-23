import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, it, expect, vi } from 'vitest';
import * as PdfCleanEn from './pdf-clean-en.js';

// Internal types kept loose — the module is JS, so we import its helpers as any.
interface EnPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  content: string;
  hasContent: boolean;
  tags: unknown[];
}
interface JaPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  content: string;
  hasContent: boolean;
  tags: unknown[];
}

const parseArgs = PdfCleanEn.parseArgs as (
  argv: string[],
) => ReturnType<typeof PdfCleanEn.parseArgs>;
const classifyPage = PdfCleanEn.classifyPage as (e: EnPage, j: JaPage) => string;
const computeHasContent = PdfCleanEn.computeHasContent as (c: string) => boolean;
const processPage = PdfCleanEn.processPage as (
  e: EnPage,
  j: JaPage,
  opts: {
    slug: string;
    totalPages: number;
    model: string;
    callModel: (prompt: string, model: string) => Promise<string>;
  },
) => Promise<{ page: EnPage; anomaly: unknown; llmCalled: boolean }>;
const cleanSlug = PdfCleanEn.cleanSlug as (opts: Record<string, unknown>) => Promise<{
  slug: string;
  outputPath: string;
  anomalyPath: string | null;
  anomalies: number;
  processed: number;
  llmCalls: number;
}>;
const runPool = PdfCleanEn.runPool as <T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
) => Promise<T[]>;
const atomicWriteFile = PdfCleanEn.atomicWriteFile as (p: string, c: string) => void;
const discoverEnSlugs = PdfCleanEn.discoverEnSlugs as (dir: string) => string[];
const CASE_BOTH = PdfCleanEn.CASE_BOTH as string;
const CASE_JA_ONLY = PdfCleanEn.CASE_JA_ONLY as string;
const CASE_EN_ONLY = PdfCleanEn.CASE_EN_ONLY as string;
const CASE_NEITHER = PdfCleanEn.CASE_NEITHER as string;

function fakeEnvelope(text: string): string {
  return JSON.stringify({ en_clean: text });
}

function makePage(overrides: Partial<EnPage> = {}): EnPage {
  return {
    pageNum: 1,
    image: '/oxi-one-mk2/pages/page-001.png',
    title: 'Page 1',
    sectionName: null,
    content: 'raw english',
    hasContent: true,
    tags: [],
    ...overrides,
  };
}

describe('parseArgs', () => {
  it('requires --slug or --all', () => {
    expect(() => parseArgs([])).toThrow(/Missing --slug/);
  });

  it('rejects both --slug and --all together', () => {
    expect(() => parseArgs(['--slug', 'foo', '--all'])).toThrow(/mutually exclusive/);
  });

  it('accepts --slug and default values', () => {
    const a = parseArgs(['--slug', 'oxi-one-mk2']);
    expect(a.slug).toBe('oxi-one-mk2');
    expect(a.all).toBe(false);
    expect(a.dryRun).toBe(false);
    expect(a.model).toBe('haiku');
    expect(a.concurrency).toBe(5);
    expect(a.force).toBe(false);
  });

  it('accepts --all', () => {
    const a = parseArgs(['--all']);
    expect(a.all).toBe(true);
  });

  it('rejects invalid slug', () => {
    expect(() => parseArgs(['--slug', '../evil'])).toThrow(/Invalid slug/);
  });

  it('--sonnet sets model to sonnet', () => {
    const a = parseArgs(['--slug', 'x', '--sonnet']);
    expect(a.model).toBe('sonnet');
  });

  it('--concurrency rejects non-integer', () => {
    expect(() => parseArgs(['--all', '--concurrency', 'abc'])).toThrow(/positive integer/);
    expect(() => parseArgs(['--all', '--concurrency', '0'])).toThrow(/positive integer/);
    expect(() => parseArgs(['--all', '--concurrency', '-1'])).toThrow(/positive integer/);
  });

  it('--concurrency accepts positive integer', () => {
    const a = parseArgs(['--all', '--concurrency', '3']);
    expect(a.concurrency).toBe(3);
  });

  it('--help short-circuits required flags', () => {
    const a = parseArgs(['--help']);
    expect(a.help).toBe(true);
  });

  it('rejects unknown argument', () => {
    expect(() => parseArgs(['--bogus'])).toThrow(/Unknown argument/);
  });
});

describe('classifyPage', () => {
  it('returns both when both have content', () => {
    expect(classifyPage(makePage({ hasContent: true }), makePage({ hasContent: true }))).toBe(
      CASE_BOTH,
    );
  });
  it('returns ja-only when EN empty but JA has content', () => {
    expect(
      classifyPage(makePage({ hasContent: false, content: '' }), makePage({ hasContent: true })),
    ).toBe(CASE_JA_ONLY);
  });
  it('returns en-only when JA empty but EN has content', () => {
    expect(
      classifyPage(makePage({ hasContent: true }), makePage({ hasContent: false, content: '' })),
    ).toBe(CASE_EN_ONLY);
  });
  it('returns neither when both empty', () => {
    expect(
      classifyPage(
        makePage({ hasContent: false, content: '' }),
        makePage({ hasContent: false, content: '' }),
      ),
    ).toBe(CASE_NEITHER);
  });
});

describe('computeHasContent', () => {
  it('true for non-empty trimmed strings', () => {
    expect(computeHasContent('a')).toBe(true);
    expect(computeHasContent('  a  ')).toBe(true);
  });
  it('false for empty or whitespace-only', () => {
    expect(computeHasContent('')).toBe(false);
    expect(computeHasContent('   \n  ')).toBe(false);
  });
});

describe('processPage quadrants', () => {
  it('CASE_BOTH: LLM output passed through, hasContent recomputed, no anomaly', async () => {
    const enPage = makePage({ content: '  raw with headers  ', hasContent: true });
    const jaPage = makePage({ content: 'クリーンな日本語', hasContent: true });
    const callModel = vi.fn(async () => fakeEnvelope('Cleaned English.'));
    const { page, anomaly, llmCalled } = await processPage(enPage, jaPage, {
      slug: 'oxi-one-mk2',
      totalPages: 10,
      model: 'haiku',
      callModel,
    });
    expect(callModel).toHaveBeenCalledTimes(1);
    expect(page.content).toBe('Cleaned English.');
    expect(page.hasContent).toBe(true);
    expect(anomaly).toBeNull();
    expect(llmCalled).toBe(true);
  });

  it('CASE_JA_ONLY: LLM NOT called, blanked, anomaly logged', async () => {
    const enPage = makePage({ content: '', hasContent: false });
    const jaPage = makePage({ content: '本文あり', hasContent: true });
    const callModel = vi.fn();
    const { page, anomaly, llmCalled } = await processPage(enPage, jaPage, {
      slug: 'oxi-one-mk2',
      totalPages: 10,
      model: 'haiku',
      callModel: callModel as unknown as (p: string, m: string) => Promise<string>,
    });
    expect(callModel).not.toHaveBeenCalled();
    expect(page.content).toBe('');
    expect(page.hasContent).toBe(false);
    expect(anomaly).toMatchObject({ case: 'en-empty-but-ja-has-content', pageNum: 1 });
    expect(llmCalled).toBe(false);
  });

  it('CASE_EN_ONLY: LLM called with clean_ja=null, anomaly logged', async () => {
    const enPage = makePage({ content: '24 The OXI ONE MKII Manual', hasContent: true });
    const jaPage = makePage({ content: '', hasContent: false });
    let receivedPrompt = '';
    const callModel = vi.fn(async (prompt: string) => {
      receivedPrompt = prompt;
      return fakeEnvelope('');
    });
    const { page, anomaly, llmCalled } = await processPage(enPage, jaPage, {
      slug: 'oxi-one-mk2',
      totalPages: 10,
      model: 'haiku',
      callModel,
    });
    expect(callModel).toHaveBeenCalledTimes(1);
    expect(receivedPrompt).toContain('(none');
    expect(page.content).toBe('');
    expect(page.hasContent).toBe(false);
    expect(anomaly).toMatchObject({ case: 'ja-empty-but-en-has-content', pageNum: 1 });
    expect(llmCalled).toBe(true);
  });

  it('CASE_NEITHER: passed through unchanged, LLM NOT called, no anomaly', async () => {
    const enPage = makePage({ content: '', hasContent: false });
    const jaPage = makePage({ content: '', hasContent: false });
    const callModel = vi.fn();
    const { page, anomaly, llmCalled } = await processPage(enPage, jaPage, {
      slug: 'oxi-one-mk2',
      totalPages: 10,
      model: 'haiku',
      callModel: callModel as unknown as (p: string, m: string) => Promise<string>,
    });
    expect(callModel).not.toHaveBeenCalled();
    expect(page.content).toBe('');
    expect(page.hasContent).toBe(false);
    expect(anomaly).toBeNull();
    expect(llmCalled).toBe(false);
  });
});

describe('runPool concurrency limit', () => {
  it('never exceeds the configured limit', async () => {
    let active = 0;
    let peak = 0;
    const tasks: Array<() => Promise<number>> = [];
    for (let i = 0; i < 20; i++) {
      tasks.push(async () => {
        active++;
        if (active > peak) peak = active;
        await new Promise((r) => setTimeout(r, 5));
        active--;
        return i;
      });
    }
    const out = await runPool(tasks, 3);
    expect(peak).toBeLessThanOrEqual(3);
    expect(out).toEqual([...Array(20).keys()]);
  });

  it('preserves order even when tasks resolve out-of-order', async () => {
    const tasks = [0, 1, 2, 3].map(
      (i) => () => new Promise<number>((r) => setTimeout(() => r(i), (4 - i) * 5)),
    );
    const out = await runPool(tasks, 4);
    expect(out).toEqual([0, 1, 2, 3]);
  });

  it('rejects on first error', async () => {
    const tasks = [
      async () => 1,
      async () => {
        throw new Error('boom');
      },
      async () => 3,
    ];
    await expect(runPool(tasks, 2)).rejects.toThrow('boom');
  });
});

describe('atomicWriteFile', () => {
  it('writes to target and leaves no .tmp behind on success', () => {
    const dir = mkdtempSync(join(tmpdir(), 'clean-en-atomic-'));
    try {
      const target = join(dir, 'out.json');
      atomicWriteFile(target, 'hello');
      expect(readFileSync(target, 'utf-8')).toBe('hello');
      expect(existsSync(`${target}.pdf-clean-en.tmp`)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('creates parent directories if missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'clean-en-atomic-mkdir-'));
    try {
      const target = join(dir, 'nested', 'deep', 'out.json');
      atomicWriteFile(target, 'content');
      expect(readFileSync(target, 'utf-8')).toBe('content');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('discoverEnSlugs', () => {
  it('returns sorted slugs that have pages-en.json, skipping non-manual dirs', () => {
    const dir = mkdtempSync(join(tmpdir(), 'clean-en-discover-'));
    try {
      // Valid manual
      mkdirSync(join(dir, 'manual-a', 'data'), { recursive: true });
      writeFileSync(join(dir, 'manual-a', 'data', 'pages-en.json'), '{}');
      mkdirSync(join(dir, 'manual-b', 'data'), { recursive: true });
      writeFileSync(join(dir, 'manual-b', 'data', 'pages-en.json'), '{}');
      // Directory without pages-en.json
      mkdirSync(join(dir, 'img'));
      // Stray file
      writeFileSync(join(dir, '_headers'), 'x');
      // Slug-invalid directory with pages-en.json (should still be filtered)
      mkdirSync(join(dir, 'Bad_Slug', 'data'), { recursive: true });
      writeFileSync(join(dir, 'Bad_Slug', 'data', 'pages-en.json'), '{}');

      const slugs = discoverEnSlugs(dir);
      expect(slugs).toEqual(['manual-a', 'manual-b']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns [] when publicDir does not exist', () => {
    expect(discoverEnSlugs(join(tmpdir(), 'nonexistent-' + Date.now()))).toEqual([]);
  });
});

// --------------------------------------------------------------------------
// Integration-ish: cleanSlug with mocked subprocess + fixture on disk
// --------------------------------------------------------------------------

function makeFixture(): {
  rootDir: string;
  slug: string;
  cleanup: () => void;
} {
  const rootDir = mkdtempSync(join(tmpdir(), 'clean-en-fixture-'));
  const slug = 'fixture';
  const dataDir = join(rootDir, 'public', slug, 'data');
  mkdirSync(dataDir, { recursive: true });

  const enDoc = {
    metadata: { processedAt: '2026-04-01T00:00:00Z', language: 'en' },
    pages: [
      {
        pageNum: 1,
        image: '/fixture/pages/page-001.png',
        title: 'Page 1',
        sectionName: null,
        content: '24 The OXI ONE MKII Manual\nRaw body 1',
        hasContent: true,
        tags: [],
      },
      {
        pageNum: 2,
        image: '/fixture/pages/page-002.png',
        title: 'Page 2',
        sectionName: null,
        content: '',
        hasContent: false,
        tags: [],
      },
      {
        pageNum: 3,
        image: '/fixture/pages/page-003.png',
        title: 'Page 3',
        sectionName: null,
        content: 'Running header cruft',
        hasContent: true,
        tags: [],
      },
      {
        pageNum: 4,
        image: '/fixture/pages/page-004.png',
        title: 'Page 4',
        sectionName: null,
        content: '',
        hasContent: false,
        tags: [],
      },
    ],
  };
  const jaDoc = {
    metadata: { processedAt: '2026-04-01T00:00:00Z', language: 'ja' },
    pages: [
      {
        pageNum: 1,
        image: '/fixture/pages/page-001.png',
        title: 'Page 1',
        sectionName: null,
        content: '日本語本文1',
        hasContent: true,
        tags: [],
      },
      {
        pageNum: 2,
        image: '/fixture/pages/page-002.png',
        title: 'Page 2',
        sectionName: null,
        content: '日本語のみ',
        hasContent: true,
        tags: [],
      },
      {
        pageNum: 3,
        image: '/fixture/pages/page-003.png',
        title: 'Page 3',
        sectionName: null,
        content: '',
        hasContent: false,
        tags: [],
      },
      {
        pageNum: 4,
        image: '/fixture/pages/page-004.png',
        title: 'Page 4',
        sectionName: null,
        content: '',
        hasContent: false,
        tags: [],
      },
    ],
  };

  writeFileSync(join(dataDir, 'pages-en.json'), JSON.stringify(enDoc, null, 2));
  writeFileSync(join(dataDir, 'pages-ja.json'), JSON.stringify(jaDoc, null, 2));
  return {
    rootDir,
    slug,
    cleanup: () => rmSync(rootDir, { recursive: true, force: true }),
  };
}

describe('cleanSlug integration', () => {
  it('processes all four quadrants end-to-end and writes atomically', async () => {
    const { rootDir, slug, cleanup } = makeFixture();
    try {
      const callModel = vi.fn(async (prompt: string) => {
        // Inspect prompt to decide response.
        if (prompt.includes('Raw body 1')) return fakeEnvelope('Raw body 1');
        if (prompt.includes('Running header cruft')) return fakeEnvelope(''); // en-only cruft → empty
        return fakeEnvelope('unexpected');
      });

      const result = await cleanSlug({
        rootDir,
        slug,
        dryRun: false,
        model: 'haiku',
        concurrency: 2,
        force: true, // bypass git check on tmp fixture
        callModel,
        log: () => {},
        now: () => new Date('2026-04-15T12:00:00Z'),
      });

      expect(result.processed).toBe(4);
      // Page 1: CASE_BOTH → LLM call
      // Page 2: CASE_JA_ONLY → skipped
      // Page 3: CASE_EN_ONLY → LLM call
      // Page 4: CASE_NEITHER → skipped
      expect(result.llmCalls).toBe(2);
      expect(callModel).toHaveBeenCalledTimes(2);
      expect(result.anomalies).toBe(2);

      const enPath = join(rootDir, 'public', slug, 'data', 'pages-en.json');
      const updated = JSON.parse(readFileSync(enPath, 'utf-8'));
      expect(updated.metadata.cleanupMethod).toBe('claude-code-subagent');
      expect(updated.metadata.cleanupModel).toBe('haiku');
      expect(updated.metadata.cleanedAt).toBe('2026-04-15T12:00:00.000Z');
      // Original metadata preserved
      expect(updated.metadata.language).toBe('en');

      expect(updated.pages[0].content).toBe('Raw body 1');
      expect(updated.pages[0].hasContent).toBe(true);
      expect(updated.pages[1].content).toBe('');
      expect(updated.pages[1].hasContent).toBe(false);
      expect(updated.pages[2].content).toBe('');
      expect(updated.pages[2].hasContent).toBe(false);
      expect(updated.pages[3].content).toBe('');
      expect(updated.pages[3].hasContent).toBe(false);

      // No lingering tmp file
      expect(existsSync(`${enPath}.pdf-clean-en.tmp`)).toBe(false);

      // Anomalies file present in __inbox/
      const anomalyPath = join(rootDir, '__inbox', `pdf-clean-en-anomalies-${slug}.json`);
      expect(existsSync(anomalyPath)).toBe(true);
      const anomDoc = JSON.parse(readFileSync(anomalyPath, 'utf-8'));
      expect(anomDoc.count).toBe(2);
      const cases = anomDoc.anomalies.map((a: { case: string }) => a.case).sort();
      expect(cases).toEqual(['en-empty-but-ja-has-content', 'ja-empty-but-en-has-content']);
    } finally {
      cleanup();
    }
  });

  it('dry-run writes to __inbox and leaves pages-en.json untouched', async () => {
    const { rootDir, slug, cleanup } = makeFixture();
    try {
      const enPath = join(rootDir, 'public', slug, 'data', 'pages-en.json');
      const before = readFileSync(enPath, 'utf-8');
      const callModel = vi.fn(async () => fakeEnvelope('cleaned'));
      const result = await cleanSlug({
        rootDir,
        slug,
        dryRun: true,
        model: 'haiku',
        concurrency: 1,
        force: true,
        callModel,
        log: () => {},
      });
      expect(result.outputPath).toContain('__inbox');
      expect(readFileSync(enPath, 'utf-8')).toBe(before);
      expect(existsSync(join(rootDir, '__inbox', `pages-en-clean-${slug}.json`))).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('refuses to run on dirty tree without --force', async () => {
    const { rootDir, slug, cleanup } = makeFixture();
    try {
      await expect(
        cleanSlug({
          rootDir,
          slug,
          dryRun: true,
          model: 'haiku',
          concurrency: 1,
          force: false,
          callModel: async () => fakeEnvelope(''),
          isCleanFn: () => false,
          log: () => {},
        }),
      ).rejects.toThrow(/dirty tree/);
    } finally {
      cleanup();
    }
  });

  it('honors --force on dirty tree', async () => {
    const { rootDir, slug, cleanup } = makeFixture();
    try {
      const callModel = vi.fn(async () => fakeEnvelope('ok'));
      const result = await cleanSlug({
        rootDir,
        slug,
        dryRun: true,
        model: 'haiku',
        concurrency: 1,
        force: true,
        callModel,
        isCleanFn: () => false,
        log: () => {},
      });
      expect(result.processed).toBe(4);
    } finally {
      cleanup();
    }
  });

  it('honors concurrency limit during cleanSlug', async () => {
    const { rootDir, slug, cleanup } = makeFixture();
    try {
      let active = 0;
      let peak = 0;
      const callModel = vi.fn(async () => {
        active++;
        if (active > peak) peak = active;
        await new Promise((r) => setTimeout(r, 10));
        active--;
        return fakeEnvelope('x');
      });
      await cleanSlug({
        rootDir,
        slug,
        dryRun: true,
        model: 'haiku',
        concurrency: 1,
        force: true,
        callModel,
        log: () => {},
      });
      expect(peak).toBeLessThanOrEqual(1);
    } finally {
      cleanup();
    }
  });
});
