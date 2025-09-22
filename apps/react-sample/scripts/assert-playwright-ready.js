#!/usr/bin/env node

import { readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const customCache = process.env.PLAYWRIGHT_BROWSERS_PATH;

function candidateDirs() {
  if (customCache) {
    return [customCache];
  }

  if (process.platform === 'win32') {
    const localAppData =
      process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return [path.join(localAppData, 'ms-playwright')];
  }

  if (process.platform === 'darwin') {
    return [path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')];
  }

  return [path.join(os.homedir(), '.cache', 'ms-playwright')];
}

console.log('[playwright-check] START: Checking for Playwright Chromium binary');

function checkDirectoryWithTimeout(dir, timeoutMs = 5000) {
  return new Promise((resolve) => {
    console.log(`[playwright-check] Starting check for directory: ${dir}`);

    const timeout = setTimeout(() => {
      console.warn(`[playwright-check] TIMEOUT: Directory check exceeded ${timeoutMs}ms for: ${dir}`);
      resolve(false);
    }, timeoutMs);

    try {
      console.log(`[playwright-check] Reading directory contents: ${dir}`);
      const entries = readdirSync(dir);
      console.log(`[playwright-check] Found ${entries.length} entries in: ${dir}`);

      clearTimeout(timeout);
      const found = entries.some((entry) => entry.startsWith('chromium'));
      console.log(`[playwright-check] Chromium binary ${found ? 'FOUND' : 'NOT FOUND'} in: ${dir}`);
      resolve(found);
    } catch (error) {
      clearTimeout(timeout);
      console.warn(`[playwright-check] ERROR reading directory ${dir}: ${error.message}`);
      resolve(false);
    }
  });
}

const dirs = candidateDirs();
console.log(`[playwright-check] Candidate directories: ${dirs.join(', ')}`);

let chromiumFound = false;
for (const dir of dirs) {
  console.log(`[playwright-check] Checking directory: ${dir}`);
  const found = await checkDirectoryWithTimeout(dir);
  if (found) {
    console.log(`[playwright-check] SUCCESS: Found chromium in: ${dir}`);
    chromiumFound = true;
    break;
  }
  console.log(`[playwright-check] Directory check complete for: ${dir}`);
}

console.log(`[playwright-check] Final result: chromiumFound = ${chromiumFound}`);

if (!chromiumFound) {
  console.error('[playwright-check] FAILURE: Playwright Chromium binary missing. Run "pnpm playwright:install" or reinstall behavior-driven-ui.');
  console.log('[playwright-check] END: Script exiting with error');
  process.exit(1);
}

console.log('[playwright-check] SUCCESS: Playwright Chromium binary found');
console.log('[playwright-check] END: Script completed successfully');
