#!/usr/bin/env node
'use strict';

const console = require('node:console');
const { existsSync } = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const { pathToFileURL } = require('node:url');

async function runCli() {
  const packageRoot = __dirname;
  const distEntry = path.join(packageRoot, 'dist', 'cli.js');

  if (existsSync(distEntry)) {
    await import(pathToFileURL(distEntry).href);
    return;
  }

  const { register } = await import('tsx/esm/api');
  if (typeof register !== 'function') {
    throw new Error('tsx.register was not available');
  }

  register({
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
