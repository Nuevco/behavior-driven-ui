#!/usr/bin/env node
import console from 'node:console';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function runCli() {
  const packageRoot = path.dirname(fileURLToPath(import.meta.url));
  const distEntry = path.join(packageRoot, 'dist', 'cli.js');

  if (existsSync(distEntry)) {
    await import(pathToFileURL(distEntry).href);
    return;
  }

  const tsxModule = await import('tsx/esm/api');
  if (typeof tsxModule.register !== 'function') {
    throw new Error('tsx.register was not available');
  }

  tsxModule.register({
    jsx: 'preserve',
    format: { '\\.(tsx?)$': 'module' },
  });

  const sourceEntry = path.join(packageRoot, 'src', 'cli', 'bin.ts');
  await import(pathToFileURL(sourceEntry).href);
}

runCli().catch((error) => {
  const cause =
    error instanceof Error
      ? error
      : new Error(String(error ?? 'Unknown CLI error'));
  console.error(cause);
  if (typeof process.exitCode !== 'number') {
    process.exitCode = 1;
  }
});
