import { Command } from 'commander';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

const executeInitMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    projectRoot: '/repo',
    configPath: '/repo/bdui.config.ts',
    createdFiles: ['/repo/bdui.config.ts'],
    skippedFiles: [],
    createdDirectories: ['/repo/features'],
    skippedDirectories: [],
  })
);

vi.mock('../../src/cli/init/execute-init.js', () => ({
  executeInit: executeInitMock,
}));

describe('registerInitCommand', () => {
  const consoleSpy = vi
    .spyOn(globalThis.console, 'log')
    .mockImplementation(() => undefined);

  afterEach(() => {
    consoleSpy.mockClear();
    executeInitMock.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('adds the init subcommand and forwards options', async () => {
    const { registerInitCommand } = await import(
      '../../src/cli/init/command.js'
    );

    const program = new Command();
    registerInitCommand(program);
    program.exitOverride();

    await program.parseAsync([
      'node',
      'bdui',
      'init',
      '--config',
      './config/bdui.ts',
    ]);

    expect(executeInitMock).toHaveBeenCalledWith({
      config: './config/bdui.ts',
    });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
