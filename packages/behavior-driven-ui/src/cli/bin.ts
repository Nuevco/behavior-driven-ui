#!/usr/bin/env node
import { runBduiCli } from './index.js';

runBduiCli().catch((error: unknown) => {
  const logger = globalThis.console;
  if (logger && typeof logger.error === 'function') {
    logger.error(error);
  }

  if (globalThis.process) {
    globalThis.process.exitCode = globalThis.process.exitCode ?? 1;
  }
});
