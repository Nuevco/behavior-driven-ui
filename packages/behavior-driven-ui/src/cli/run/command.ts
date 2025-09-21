import { Command } from 'commander';

import { executeRun } from './execute-run.js';

export interface RegisterRunCommandOptions {
  readonly defaultCommand?: boolean;
}

export function registerRunCommand(
  program: Command,
  options: RegisterRunCommandOptions = {}
): Command {
  const runCommand = program
    .command('run')
    .description('Execute BDUI features using the project configuration')
    .option(
      '-c, --config <path>',
      'Path to a bdui.config.* file (relative to the current working directory)'
    )
    .action(async (cmdOptions: { config?: string }) => {
      if (typeof cmdOptions.config === 'string') {
        await executeRun({ config: cmdOptions.config });
        return;
      }

      await executeRun();
    });

  if (options.defaultCommand) {
    program.addCommand(runCommand, { isDefault: true, hidden: true });
  }

  return runCommand;
}
