#!/usr/bin/env node
/* eslint-env node */
'use strict';

const { spawnSync } = require('node:child_process');

const SKIP_ENV = 'BDUI_SKIP_BROWSER_INSTALL';

if (process.env[SKIP_ENV]) {
  console.log(
    '[bdui] Skipping Playwright browser install (BDUI_SKIP_BROWSER_INSTALL set).'
  );
  process.exit(0);
}

let cliPath;
try {
  cliPath = require.resolve('@playwright/test/cli');
} catch (error) {
  console.error(
    '[bdui] Unable to resolve Playwright CLI. Is @playwright/test installed?',
    error
  );
  process.exit(1);
}

const args = [cliPath, 'install'];
if (process.platform === 'linux') {
  args.push('--with-deps');
}
args.push('chromium');

console.log('[bdui] Ensuring Playwright Chromium browser is installed…');

const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
});

if (result.error) {
  console.error('[bdui] Playwright install failed with error:', result.error);
  process.exit(result.status ?? 1);
}

if (result.status !== 0) {
  console.error(
    `[bdui] Playwright install exited with status ${result.status}.`
  );
  process.exit(result.status);
}

console.log('[bdui] Playwright Chromium browser ready.');
