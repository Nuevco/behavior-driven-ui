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

const chromiumFound = candidateDirs().some((dir) => {
  try {
    return readdirSync(dir).some((entry) => entry.startsWith('chromium'));
  } catch (error) {
    return false;
  }
});

if (!chromiumFound) {
  console.error(
    '[react-sample] Playwright Chromium binary missing. Run "pnpm playwright:install" or reinstall behavior-driven-ui.'
  );
  process.exit(1);
}
