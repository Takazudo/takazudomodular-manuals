#!/usr/bin/env node

/**
 * pdf-clean-en.js — reformat the `content` field of every page in
 * `public/{slug}/data/pages-en.json` using the sibling `pages-ja.json` as a
 * structural reference, via per-page Claude Code CLI subprocess calls (Haiku
 * by default).
 *
 * IMPORTANT design note: this script dispatches local `claude` CLI
 * subprocesses — it does NOT use the Anthropic SDK and does NOT need
 * `ANTHROPIC_API_KEY`. It piggybacks on the same OAuth session Claude Code
 * itself uses, matching the project's existing "Claude Code subagent"
 * pattern.
 *
 * English wording is preserved VERBATIM. This is EN → formatted EN, NOT
 * translation.
 *
 * Usage:
 *   node scripts/pdf-clean-en.js --slug oxi-one-mk2
 *   node scripts/pdf-clean-en.js --all
 *   node scripts/pdf-clean-en.js --slug oxi-one-mk2 --dry-run
 *   node scripts/pdf-clean-en.js --slug oxi-one-mk2 --sonnet
 *   node scripts/pdf-clean-en.js --slug oxi-one-mk2 --model haiku --concurrency 3
 *   node scripts/pdf-clean-en.js --slug oxi-one-mk2 --force
 *
 * Flags:
 *   --slug <slug>      Single manual to process.
 *   --all              Process every manual under public/ that has a pages-en.json.
 *   --dry-run          Write output to __inbox/pages-en-clean-{slug}.json
 *                      instead of overwriting public/{slug}/data/pages-en.json.
 *   --model <id>       Claude model id or alias. Default "haiku".
 *   --sonnet           Shorthand for --model sonnet.
 *   --concurrency <n>  Parallel subprocess limit. Default 5.
 *   --force            Skip the dirty-tree refusal.
 *   --help / -h        Print this help and exit 0.
 */

import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'fs';
import { spawn, spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildEnCleanupPrompt, parseEnCleanResponse } from './lib/en-cleanup-prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const ROOT_DIR = join(__dirname, '..');

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

export const DEFAULT_MODEL = 'haiku';
export const SONNET_MODEL = 'sonnet';
export const DEFAULT_CONCURRENCY = 5;
export const CLEANUP_METHOD = 'claude-code-subagent';

const SLUG_RE = /^[a-z0-9-]+$/i;

// --------------------------------------------------------------------------
// CLI arg parsing
// --------------------------------------------------------------------------

/**
 * Parse CLI args.
 *
 * @param {string[]} argv - process.argv.slice(2) style array
 * @returns {{
 *   slug: string | null,
 *   all: boolean,
 *   dryRun: boolean,
 *   model: string,
 *   concurrency: number,
 *   force: boolean,
 *   help: boolean,
 * }}
 */
export function parseArgs(argv) {
  const args = {
    slug: null,
    all: false,
    dryRun: false,
    model: DEFAULT_MODEL,
    concurrency: DEFAULT_CONCURRENCY,
    force: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--slug':
        args.slug = argv[++i] || null;
        break;
      case '--all':
        args.all = true;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--model':
        args.model = argv[++i] || DEFAULT_MODEL;
        break;
      case '--sonnet':
        args.model = SONNET_MODEL;
        break;
      case '--concurrency': {
        const next = argv[++i];
        const parsed = Number(next);
        if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
          throw new Error(`--concurrency must be a positive integer, got: ${next}`);
        }
        args.concurrency = parsed;
        break;
      }
      case '--force':
        args.force = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }

  if (args.help) return args;
  if (!args.all && !args.slug) {
    throw new Error('Missing --slug <slug> or --all');
  }
  if (args.all && args.slug) {
    throw new Error('--all and --slug are mutually exclusive');
  }
  if (args.slug && !SLUG_RE.test(args.slug)) {
    throw new Error(`Invalid slug: ${args.slug}`);
  }
  return args;
}

export function printHelp() {
  // Help text mirrors the header comment.
  const lines = [
    'pdf-clean-en.js — reformat pages-en.json via local `claude` CLI subprocesses.',
    '',
    'Usage:',
    '  node scripts/pdf-clean-en.js --slug <slug>',
    '  node scripts/pdf-clean-en.js --all',
    '',
    'Flags:',
    '  --slug <slug>      Single manual to process.',
    '  --all              Every manual under public/ with a pages-en.json.',
    '  --dry-run          Write to __inbox/ instead of overwriting.',
    '  --model <id>       Claude model id/alias. Default "haiku".',
    '  --sonnet           Shorthand for --model sonnet.',
    '  --concurrency <n>  Parallel subprocess limit. Default 5.',
    '  --force            Bypass the dirty-tree refusal.',
    '  --help, -h         Print this help.',
  ];
  console.log(lines.join('\n'));
}

// --------------------------------------------------------------------------
// Manual discovery
// --------------------------------------------------------------------------

/**
 * Discover all slugs under public/ that have a pages-en.json.
 *
 * @param {string} publicDir
 * @returns {string[]}
 */
export function discoverEnSlugs(publicDir) {
  if (!existsSync(publicDir)) return [];
  const out = [];
  for (const name of readdirSync(publicDir)) {
    if (!SLUG_RE.test(name)) continue;
    const abs = join(publicDir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    if (existsSync(join(abs, 'data', 'pages-en.json'))) {
      out.push(name);
    }
  }
  out.sort();
  return out;
}

// --------------------------------------------------------------------------
// Dirty-tree check
// --------------------------------------------------------------------------

/**
 * Return true if `public/{slug}/data/` has no uncommitted changes according
 * to git. Any failure (e.g. not a git repo) returns true so the check is
 * permissive outside of real dev use.
 *
 * @param {string} rootDir
 * @param {string} slug
 * @param {{ runGit?: (args: string[], cwd: string) => { status: number } }} [deps]
 * @returns {boolean}
 */
export function isWorkingTreeClean(rootDir, slug, deps = {}) {
  const runGit = deps.runGit || defaultRunGit;
  try {
    const res = runGit(['diff', '--quiet', '--', `public/${slug}/data/`], rootDir);
    return res.status === 0;
  } catch {
    return true;
  }
}

function defaultRunGit(args, cwd) {
  return spawnSync('git', args, { cwd, stdio: 'ignore' });
}

// --------------------------------------------------------------------------
// Core per-page logic
// --------------------------------------------------------------------------

/**
 * Case classification for (ja.hasContent, en.hasContent) quadrant.
 */
export const CASE_BOTH = 'both';
export const CASE_JA_ONLY = 'ja-only'; // JA=true, EN=false  → en-empty-but-ja-has-content anomaly
export const CASE_EN_ONLY = 'en-only'; // JA=false, EN=true  → ja-empty-but-en-has-content anomaly
export const CASE_NEITHER = 'neither'; // JA=false, EN=false → passthrough

/**
 * Classify a page pair into one of the four cases above.
 *
 * @param {{hasContent: boolean}} enPage
 * @param {{hasContent: boolean}} jaPage
 */
export function classifyPage(enPage, jaPage) {
  if (jaPage.hasContent && enPage.hasContent) return CASE_BOTH;
  if (jaPage.hasContent && !enPage.hasContent) return CASE_JA_ONLY;
  if (!jaPage.hasContent && enPage.hasContent) return CASE_EN_ONLY;
  return CASE_NEITHER;
}

/**
 * Recompute hasContent from a content string. Whitespace-only content
 * counts as empty.
 *
 * @param {string} content
 */
export function computeHasContent(content) {
  return typeof content === 'string' && content.trim().length > 0;
}

/**
 * Truncate a string for anomaly logging.
 *
 * @param {string} s
 * @param {number} [max=140]
 */
export function previewString(s, max = 140) {
  if (typeof s !== 'string') return '';
  const flat = s.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max) + '…';
}

/**
 * Process a single page pair.
 *
 * @param {object} enPage - entry from pages-en.json
 * @param {object} jaPage - entry from pages-ja.json
 * @param {object} opts
 * @param {string} opts.slug
 * @param {number} opts.totalPages
 * @param {string} opts.model
 * @param {(prompt: string, model: string) => Promise<string>} opts.callModel
 *   Function that runs the subprocess and returns the assistant text.
 * @returns {Promise<{ page: object, anomaly: object | null, llmCalled: boolean }>}
 */
export async function processPage(enPage, jaPage, opts) {
  const { slug, totalPages, model, callModel } = opts;
  const kase = classifyPage(enPage, jaPage);

  // Build base shallow copy preserving shape.
  const nextPage = {
    pageNum: enPage.pageNum,
    image: enPage.image,
    title: enPage.title,
    sectionName: enPage.sectionName ?? null,
    content: enPage.content ?? '',
    hasContent: Boolean(enPage.hasContent),
    tags: Array.isArray(enPage.tags) ? enPage.tags : [],
  };

  if (kase === CASE_NEITHER) {
    // Pass-through. Explicitly blank content/hasContent false so both columns agree.
    nextPage.content = '';
    nextPage.hasContent = false;
    return { page: nextPage, anomaly: null, llmCalled: false };
  }

  if (kase === CASE_JA_ONLY) {
    // EN raw is empty but JA has content. Blank the EN side, log anomaly.
    nextPage.content = '';
    nextPage.hasContent = false;
    const anomaly = {
      pageNum: enPage.pageNum,
      case: 'en-empty-but-ja-has-content',
      raw_en_preview: previewString(enPage.content),
      clean_ja_preview: previewString(jaPage.content),
    };
    return { page: nextPage, anomaly, llmCalled: false };
  }

  // CASE_BOTH or CASE_EN_ONLY — call the model.
  const prompt = buildEnCleanupPrompt({
    slug,
    pageNum: enPage.pageNum,
    totalPages,
    raw_en: enPage.content ?? '',
    clean_ja: kase === CASE_EN_ONLY ? null : (jaPage.content ?? null),
  });

  const text = await callModel(prompt, model);
  const parsed = parseEnCleanResponse(text);
  const cleaned = parsed.en_clean;

  nextPage.content = cleaned;
  nextPage.hasContent = computeHasContent(cleaned);

  let anomaly = null;
  if (kase === CASE_EN_ONLY) {
    anomaly = {
      pageNum: enPage.pageNum,
      case: 'ja-empty-but-en-has-content',
      raw_en_preview: previewString(enPage.content),
      clean_ja_preview: null,
    };
  }
  return { page: nextPage, anomaly, llmCalled: true };
}

// --------------------------------------------------------------------------
// Claude CLI subprocess wrapper
// --------------------------------------------------------------------------

/**
 * Default per-call subprocess timeout in ms (3 minutes). A hung `claude`
 * subprocess would otherwise stall the Promise pool indefinitely. Can be
 * overridden via CLAUDE_CLI_TIMEOUT_MS env var or the `timeoutMs` option.
 */
export const DEFAULT_SUBPROCESS_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * Call the local `claude` CLI with a prompt and return the assistant text.
 *
 * Writes the prompt to stdin to avoid shell-quoting pitfalls. Parses the
 * --output-format=json envelope and returns the `.result` field. Kills the
 * subprocess with SIGKILL if it does not exit within `timeoutMs`.
 *
 * @param {string} prompt
 * @param {string} model
 * @param {{ claudeBin?: string, spawn?: typeof spawn, timeoutMs?: number }} [deps]
 * @returns {Promise<string>} assistant response text
 */
export function callClaudeCli(prompt, model, deps = {}) {
  const bin = deps.claudeBin || process.env.CLAUDE_CLI_BIN || 'claude';
  const spawnFn = deps.spawn || spawn;
  const envTimeout = Number(process.env.CLAUDE_CLI_TIMEOUT_MS);
  const timeoutMs =
    deps.timeoutMs ??
    (Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : DEFAULT_SUBPROCESS_TIMEOUT_MS);
  const args = [
    '-p',
    '--model',
    model,
    '--output-format',
    'json',
    '--permission-mode',
    'bypassPermissions',
    '--no-session-persistence',
    '--disable-slash-commands',
    '--system-prompt',
    'You are a text formatter. Respond with a single JSON object and nothing else.',
  ];

  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnFn(bin, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
      reject(err);
      return;
    }

    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
      finish(reject, new Error(`claude CLI timed out after ${timeoutMs}ms (killed with SIGKILL)`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf-8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf-8');
    });
    child.on('error', (err) => finish(reject, err));
    child.on('close', (code) => {
      if (settled) return;
      if (code !== 0) {
        finish(reject, new Error(`claude CLI exited with code ${code}\n${stderr}`));
        return;
      }
      let envelope;
      try {
        envelope = JSON.parse(stdout);
      } catch (err) {
        finish(
          reject,
          new Error(
            `claude CLI stdout was not JSON: ${err.message}\n---stdout---\n${stdout.slice(0, 2000)}`,
          ),
        );
        return;
      }
      if (envelope.is_error) {
        finish(
          reject,
          new Error(
            `claude CLI returned is_error=true: ${envelope.result || JSON.stringify(envelope)}`,
          ),
        );
        return;
      }
      if (typeof envelope.result !== 'string') {
        finish(
          reject,
          new Error(
            `claude CLI envelope missing .result: ${JSON.stringify(envelope).slice(0, 500)}`,
          ),
        );
        return;
      }
      finish(resolve, envelope.result);
    });

    child.stdin.end(prompt, 'utf-8');
  });
}

// --------------------------------------------------------------------------
// Promise pool
// --------------------------------------------------------------------------

/**
 * Run async tasks with a bounded concurrency. Returns an array of results in
 * input order. If a task rejects, the whole pool rejects (no silent failures).
 *
 * @template T
 * @param {Array<() => Promise<T>>} tasks
 * @param {number} concurrency
 * @returns {Promise<T[]>}
 */
export async function runPool(tasks, concurrency) {
  if (concurrency <= 0) throw new Error('concurrency must be > 0');
  const results = new Array(tasks.length);
  let cursor = 0;
  let activeCount = 0;
  let errored = null;

  return new Promise((resolve, reject) => {
    if (tasks.length === 0) {
      resolve(results);
      return;
    }

    const launch = () => {
      if (errored) return;
      while (activeCount < concurrency && cursor < tasks.length) {
        const idx = cursor++;
        activeCount++;
        Promise.resolve()
          .then(() => tasks[idx]())
          .then(
            (val) => {
              results[idx] = val;
              activeCount--;
              if (cursor >= tasks.length && activeCount === 0) {
                resolve(results);
              } else {
                launch();
              }
            },
            (err) => {
              if (errored) return;
              errored = err;
              reject(err);
            },
          );
      }
    };
    launch();
  });
}

// --------------------------------------------------------------------------
// Atomic write
// --------------------------------------------------------------------------

/**
 * Atomic write: write to a temp file then rename. Ctrl-C in the middle can
 * leave the .tmp file behind but will never leave a half-written target.
 *
 * @param {string} targetPath
 * @param {string} content
 */
export function atomicWriteFile(targetPath, content) {
  mkdirSync(dirname(targetPath), { recursive: true });
  const tmpPath = `${targetPath}.pdf-clean-en.tmp`;
  try {
    writeFileSync(tmpPath, content);
    renameSync(tmpPath, targetPath);
  } catch (err) {
    // Best-effort cleanup; ignore failures so the original error propagates.
    try {
      if (existsSync(tmpPath)) unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
    throw err;
  }
}

// --------------------------------------------------------------------------
// Main per-slug processor
// --------------------------------------------------------------------------

/**
 * @typedef {object} CleanSlugOptions
 * @property {string} rootDir - repo root
 * @property {string} slug
 * @property {boolean} dryRun
 * @property {string} model
 * @property {number} concurrency
 * @property {boolean} force
 * @property {(prompt: string, model: string) => Promise<string>} [callModel]
 *   Override for the subprocess call (used by tests). Defaults to callClaudeCli.
 * @property {(slug: string) => boolean} [isCleanFn]
 *   Override for the dirty-tree check.
 * @property {(msg: string) => void} [log]
 * @property {() => Date} [now]
 */

/**
 * Run the cleanup over a single slug.
 *
 * @param {CleanSlugOptions} opts
 * @returns {Promise<{ slug: string, outputPath: string, anomalyPath: string | null, anomalies: number, processed: number, llmCalls: number }>}
 */
export async function cleanSlug(opts) {
  const {
    rootDir,
    slug,
    dryRun,
    model,
    concurrency,
    force,
    callModel = callClaudeCli,
    isCleanFn,
    log = (m) => console.log(m),
    now = () => new Date(),
  } = opts;

  const dataDir = join(rootDir, 'public', slug, 'data');
  const enPath = join(dataDir, 'pages-en.json');
  const jaPath = join(dataDir, 'pages-ja.json');
  const inboxDir = join(rootDir, '__inbox');
  const dryRunOutPath = join(inboxDir, `pages-en-clean-${slug}.json`);
  const anomaliesPath = join(inboxDir, `pdf-clean-en-anomalies-${slug}.json`);

  if (!existsSync(enPath)) throw new Error(`Missing pages-en.json: ${enPath}`);
  if (!existsSync(jaPath)) throw new Error(`Missing pages-ja.json: ${jaPath}`);

  if (!force) {
    const clean = isCleanFn ? isCleanFn(slug) : isWorkingTreeClean(rootDir, slug);
    if (!clean) {
      throw new Error(
        `Refusing to run on dirty tree: public/${slug}/data/ has uncommitted changes.\n` +
          '  Commit or stash them first, or re-run with --force.',
      );
    }
  }

  const enDoc = JSON.parse(readFileSync(enPath, 'utf-8'));
  const jaDoc = JSON.parse(readFileSync(jaPath, 'utf-8'));

  if (!Array.isArray(enDoc.pages)) throw new Error(`${enPath}: missing "pages" array`);
  if (!Array.isArray(jaDoc.pages)) throw new Error(`${jaPath}: missing "pages" array`);

  // Build a pageNum → ja page lookup so we don't assume index alignment.
  const jaByPage = new Map();
  for (const p of jaDoc.pages) {
    if (p && typeof p.pageNum === 'number') jaByPage.set(p.pageNum, p);
  }

  const totalPages = enDoc.pages.length;
  log(
    `[${slug}] ${totalPages} pages, model=${model}, concurrency=${concurrency}, dryRun=${dryRun}`,
  );

  // Build per-page tasks.
  const tasks = enDoc.pages.map((enPage, idx) => async () => {
    const jaPage = jaByPage.get(enPage.pageNum) || {
      pageNum: enPage.pageNum,
      content: '',
      hasContent: false,
    };
    const result = await processPage(enPage, jaPage, { slug, totalPages, model, callModel });
    if ((idx + 1) % 10 === 0 || idx === enDoc.pages.length - 1) {
      log(`[${slug}] processed ${idx + 1}/${totalPages}`);
    }
    return result;
  });

  const results = await runPool(tasks, concurrency);

  // Assemble output doc.
  const anomalies = results.map((r) => r.anomaly).filter((a) => a !== null);
  const nextPages = results.map((r) => r.page);
  const llmCalls = results.reduce((acc, r) => acc + (r.llmCalled ? 1 : 0), 0);

  const nextDoc = {
    metadata: {
      ...(enDoc.metadata || {}),
      cleanupMethod: CLEANUP_METHOD,
      cleanupModel: model,
      cleanedAt: now().toISOString(),
    },
    pages: nextPages,
  };

  const serialized = JSON.stringify(nextDoc, null, 2) + '\n';
  const outputPath = dryRun ? dryRunOutPath : enPath;
  atomicWriteFile(outputPath, serialized);

  let anomalyPath = null;
  if (anomalies.length > 0) {
    mkdirSync(inboxDir, { recursive: true });
    const anomaliesDoc = {
      slug,
      generatedAt: now().toISOString(),
      count: anomalies.length,
      anomalies,
    };
    atomicWriteFile(anomaliesPath, JSON.stringify(anomaliesDoc, null, 2) + '\n');
    anomalyPath = anomaliesPath;
  }

  log(
    `[${slug}] done: wrote ${outputPath}${anomalies.length ? `, ${anomalies.length} anomaly/ies at ${anomaliesPath}` : ''}`,
  );

  return {
    slug,
    outputPath,
    anomalyPath,
    anomalies: anomalies.length,
    processed: nextPages.length,
    llmCalls,
  };
}

// --------------------------------------------------------------------------
// CLI entry
// --------------------------------------------------------------------------

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  (async () => {
    let args;
    try {
      args = parseArgs(process.argv.slice(2));
    } catch (err) {
      console.error(`Error: ${err.message}`);
      console.error('Run with --help for usage.');
      process.exit(2);
    }
    if (args.help) {
      printHelp();
      process.exit(0);
    }

    const publicDir = join(ROOT_DIR, 'public');
    const slugs = args.all ? discoverEnSlugs(publicDir) : [args.slug];
    if (slugs.length === 0) {
      console.error('No manuals found with a pages-en.json.');
      process.exit(1);
    }

    console.log('🧹 pdf-clean-en');
    console.log('='.repeat(50));
    console.log(`📦 Manuals: ${slugs.join(', ')}`);
    console.log(`🤖 Model: ${args.model}`);
    console.log(`⚙️  Concurrency: ${args.concurrency}`);
    console.log(`${args.dryRun ? '💨 Dry-run (writes to __inbox/)' : '💾 Overwrite mode'}`);
    console.log('');

    try {
      for (const slug of slugs) {
        await cleanSlug({
          rootDir: ROOT_DIR,
          slug,
          dryRun: args.dryRun,
          model: args.model,
          concurrency: args.concurrency,
          force: args.force,
        });
      }
      console.log('');
      console.log('✨ All done.');
    } catch (err) {
      console.error('');
      console.error('❌ pdf-clean-en failed:');
      console.error(err?.stack || err?.message || String(err));
      process.exit(1);
    }
  })();
}
