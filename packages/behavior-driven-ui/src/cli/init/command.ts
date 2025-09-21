import path from 'node:path';

import { Command } from 'commander';

import { executeInit } from './execute-init.js';

export interface RegisterInitCommandOptions {
  readonly defaultCommand?: boolean;
}

function formatRelative(base: string, target: string): string {
  const relative = path.relative(base, target);
  return relative || '.';
}

export function registerInitCommand(
  program: Command,
  options: RegisterInitCommandOptions = {}
): Command {
  const initCommand = program
    .command('init')
    .description('Scaffold default BDUI configuration and sample assets')
    .option(
      '-c, --config <path>',
      'Relative or absolute path to the configuration file to create'
    )
    .action(async (cmdOptions: { config?: string }) => {
      let result;
      if (typeof cmdOptions.config === 'string') {
        result = await executeInit({ config: cmdOptions.config });
      } else {
        result = await executeInit();
      }
      const logger = globalThis.console;
      const base = result.projectRoot;

      if (logger?.log) {
        logger.log(
          `BDUI scaffolding complete in ${formatRelative(
            base,
            result.projectRoot
          )}`
        );

        if (result.createdDirectories.length) {
          logger.log(
            `  Created directories: ${result.createdDirectories
              .map((entry) => formatRelative(base, entry))
              .join(', ')}`
          );
        }

        if (result.createdFiles.length) {
          logger.log(
            `  Created files: ${result.createdFiles
              .map((entry) => formatRelative(base, entry))
              .join(', ')}`
          );
        }

        if (result.skippedFiles.length || result.skippedDirectories.length) {
          const skipped = [...result.skippedDirectories, ...result.skippedFiles]
            .map((entry) => formatRelative(base, entry))
            .join(', ');
          logger.log(`  Skipped existing paths: ${skipped}`);
        }
      }
    });

  if (options.defaultCommand) {
    program.addCommand(initCommand, { isDefault: true, hidden: true });
  }

  return initCommand;
}
