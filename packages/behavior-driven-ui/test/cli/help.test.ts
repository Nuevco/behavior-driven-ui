// eslint-disable-next-line n/prefer-global/process
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBduiCli, runBduiCli } from '../../src/cli/index.js';

let originalExitCode: number | undefined;

beforeEach(() => {
  originalExitCode = process.exitCode;
  process.exitCode = undefined;
});

afterEach(() => {
  process.exitCode = originalExitCode;
});

describe('BDUI CLI help', () => {
  it('prints help when --help is provided', async () => {
    const output: string[] = [];
    const cli = createBduiCli();

    cli.configureOutput({
      writeOut: (str) => output.push(str),
      writeErr: (str) => output.push(str),
    });

    cli.exitOverride();

    try {
      await cli.parseAsync(['node', 'bdui', '--help'], { from: 'user' });
    } catch (error) {
      const commanderError = error as { exitCode?: number };
      expect(commanderError.exitCode).toBe(0);
    }

    expect(output.join('')).toContain('Behavior Driven UI toolkit');
  });

  it('prints help and sets exit code when no subcommand is provided', async () => {
    const stdoutSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const stderrSpy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    await runBduiCli(['node', 'bdui']);
    const printed = stdoutSpy.mock.calls
      .map(([chunk]) => String(chunk))
      .join('');

    expect(printed).toContain('Behavior Driven UI toolkit');
    expect(process.exitCode).toBe(1);

    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });
});
