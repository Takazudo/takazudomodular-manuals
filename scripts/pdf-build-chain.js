#!/usr/bin/env node

// pnpm appends CLI args only to the LAST command of a `&&` chain, so the old
// `"pdf:build": "node check-page-numbers.js && node pdf-build.js"` definition
// never forwarded --slug to the checker — it silently validated its hardcoded
// default manual instead (see issue #272). This wrapper runs both steps with
// the same argv.

import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

for (const script of ['check-page-numbers.js', 'pdf-build.js']) {
  const result = spawnSync(process.execPath, [join(__dirname, script), ...args], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
