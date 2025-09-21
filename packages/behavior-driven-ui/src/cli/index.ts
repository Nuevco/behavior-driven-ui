import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Command } from 'commander';

export {
  resolveStepFiles,
  resolveStepFilesFromConfig,
} from './steps/resolve-step-files.js';
export { ensureLoadersRegistered } from './runtime/register-loaders.js';

/**
 * Placeholder context for future CLI wiring.
 * Additional shared CLI state can be added here in subsequent steps.
 */
export type BduiCliContext = Record<string, never>;

/**
 * Creates the base BDUI command. Subcommands will be registered in later steps.
 */
export function createBduiCli(): Command {
  const program = new Command('bdui');

  program.description('Behavior Driven UI toolkit').configureHelp({
    sortSubcommands: true,
    sortOptions: true,
  });

  // Placeholder default action: display help for now.
  program.action(() => {
    const processRef = globalThis.process;
    const hasHelpFlag = Boolean(
      processRef?.argv?.some((arg) => arg === '--help' || arg === '-h')
    );

    program.outputHelp();

    if (processRef) {
      processRef.exitCode = hasHelpFlag ? 0 : 1;
    }
  });

  return program;
}

/**
 * Parses the provided argv array using the BDUI CLI.
 * The default mirrors Node.js process arguments, enabling a call-site entry point later.
 */
export async function runBduiCli(argv?: string[]): Promise<void> {
  const cli = createBduiCli();
  const args = argv ?? globalThis.process?.argv ?? [];
  await cli.parseAsync(args);
}

const isExecutedDirectly = (() => {
  if (!globalThis.process?.argv?.[1]) {
    return false;
  }

  const entryPath = path.resolve(globalThis.process.argv[1]);
  const currentModulePath = path.resolve(fileURLToPath(import.meta.url));
  return entryPath === currentModulePath;
})();

if (isExecutedDirectly) {
  runBduiCli().catch((error: unknown) => {
    const logger = globalThis.console;
    if (logger && typeof logger.error === 'function') {
      logger.error(error);
    }

    if (globalThis.process) {
      globalThis.process.exitCode = globalThis.process.exitCode ?? 1;
    }
  });
}
