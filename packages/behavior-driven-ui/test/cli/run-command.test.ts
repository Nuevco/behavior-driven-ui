/* global process */
/* eslint-disable max-lines-per-function */
import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  LoadBduiConfigOptions,
  LoadBduiConfigResult,
} from '../../src/cli/config/loader.js';
import type {
  BduiRunOptions,
  BduiRunResult,
} from '../../src/cucumber/index.js';

const loadBduiConfigMock = vi.hoisted(() =>
  vi.fn<[LoadBduiConfigOptions | undefined], Promise<LoadBduiConfigResult>>()
);
const ensureLoadersRegisteredMock = vi.hoisted(() =>
  vi.fn<[], Promise<void>>()
);
const resolveStepFilesFromConfigMock = vi.hoisted(() =>
  vi.fn<[string, readonly string[]], Promise<string[]>>()
);
const runBduiFeaturesMock = vi.hoisted(() =>
  vi.fn<[BduiRunOptions], Promise<BduiRunResult>>()
);

const serverManagerMock = vi.hoisted(() => {
  return vi.fn().mockImplementation(() => ({
    setupSignalHandlers: vi.fn(),
    start: vi.fn().mockResolvedValue({
      url: 'http://localhost:4000',
      process: { exitCode: null },
    }),
    stop: vi.fn().mockResolvedValue(undefined),
  }));
});

vi.mock('../../src/core/server-manager.js', () => ({
  ServerManager: serverManagerMock,
}));

vi.mock('../../src/cli/config/loader.js', () => ({
  loadBduiConfig: loadBduiConfigMock,
}));

vi.mock('../../src/cli/runtime/register-loaders.js', () => ({
  ensureLoadersRegistered: ensureLoadersRegisteredMock,
}));

vi.mock('../../src/cli/steps/resolve-step-files.js', () => ({
  resolveStepFilesFromConfig: resolveStepFilesFromConfigMock,
}));

vi.mock('../../src/cucumber/index.js', () => ({
  runBduiFeatures: runBduiFeaturesMock,
}));

describe('bdui run command', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    vi.resetModules();
    loadBduiConfigMock.mockReset();
    ensureLoadersRegisteredMock.mockReset();
    resolveStepFilesFromConfigMock.mockReset();
    runBduiFeaturesMock.mockReset();
    serverManagerMock.mockReset();
    serverManagerMock.mockImplementation(() => ({
      setupSignalHandlers: vi.fn(),
      start: vi.fn().mockResolvedValue({
        url: 'http://localhost:4000',
        process: { exitCode: null },
      }),
      stop: vi.fn().mockResolvedValue(undefined),
    }));
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.exitCode = undefined;
  });

  afterEach(() => {
    if (typeof originalNodeEnv === 'string') {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      Reflect.deleteProperty(process.env, 'NODE_ENV');
    }
    process.exitCode = undefined;
  });

  it('executes run flow with merged configuration', async () => {
    const projectRoot = '/tmp/project';
    const configResult: LoadBduiConfigResult = {
      projectRoot,
      configFilePath: `${projectRoot}/bdui.config.ts`,
      rawConfig: {},
      resolvedConfig: {
        projectRoot,
        configFilePath: `${projectRoot}/bdui.config.ts`,
        features: ['features/**/*.feature'],
        steps: ['custom/steps/**/*.ts'],
        driver: { kind: 'playwright', browser: 'firefox', headless: false },
        webServer: {
          command: 'pnpm dev',
          port: 4000,
          baseURL: 'https://example.test',
        },
        cucumber: { tagExpression: '@smoke', order: 'random' },
        environment: { NODE_ENV: 'test' },
      },
    };

    loadBduiConfigMock.mockResolvedValue(configResult);
    resolveStepFilesFromConfigMock.mockResolvedValue([
      `${projectRoot}/custom/steps/one.ts`,
      `${projectRoot}/custom/steps/two.ts`,
    ]);
    runBduiFeaturesMock.mockImplementation(async (options) => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(options.sources?.tagExpression).toBe('@smoke');
      expect(options.sources?.order).toBe('random');
      return { success: true } as BduiRunResult;
    });

    const { executeRun } = await import('../../src/cli/run/execute-run.js');

    await executeRun();

    expect(ensureLoadersRegisteredMock).toHaveBeenCalledTimes(1);
    expect(resolveStepFilesFromConfigMock).toHaveBeenCalledWith(projectRoot, [
      'custom/steps/**/*.ts',
    ]);
    expect(runBduiFeaturesMock).toHaveBeenCalledWith({
      cwd: projectRoot,
      features: ['features/**/*.feature'],
      support: {
        importPaths: [
          `${projectRoot}/custom/steps/one.ts`,
          `${projectRoot}/custom/steps/two.ts`,
        ],
      },
      config: {
        webServer: {
          command: 'pnpm dev',
          port: 4000,
          baseURL: 'https://example.test',
        },
        features: ['features/**/*.feature'],
        steps: ['custom/steps/**/*.ts'],
        driver: {
          kind: 'playwright',
          browser: 'firefox',
          headless: false,
        },
      },
      sources: {
        tagExpression: '@smoke',
        order: 'random',
      },
    });
    expect(process.env.NODE_ENV).toBe('development');
    expect(process.exitCode).toBeUndefined();
  });

  it('marks failure via exitCode without overriding an existing non-zero value', async () => {
    const projectRoot = '/tmp/project';
    const configResult: LoadBduiConfigResult = {
      projectRoot,
      configFilePath: null,
      rawConfig: null,
      resolvedConfig: {
        projectRoot,
        configFilePath: null,
        webServer: {
          command: 'echo "No command configured"',
          port: 5173,
          baseURL: 'http://localhost:5173',
        },
        features: ['features/**/*.feature'],
        steps: ['bdui/steps/**/*.{ts,js}'],
        driver: { kind: 'playwright', browser: 'chromium', headless: true },
        cucumber: { tagExpression: '', order: 'defined' },
        environment: {},
      },
    };

    loadBduiConfigMock.mockResolvedValue(configResult);
    resolveStepFilesFromConfigMock.mockResolvedValue([]);
    runBduiFeaturesMock.mockResolvedValue({ success: false } as BduiRunResult);

    const { executeRun } = await import('../../src/cli/run/execute-run.js');

    await executeRun();
    expect(process.exitCode).toBe(1);

    process.exitCode = 5;
    runBduiFeaturesMock.mockResolvedValue({ success: false } as BduiRunResult);
    await executeRun();
    expect(process.exitCode).toBe(5);
  });

  it('registers commander run command and forwards CLI options', async () => {
    const projectRoot = '/tmp/project';
    const configResult: LoadBduiConfigResult = {
      projectRoot,
      configFilePath: null,
      rawConfig: null,
      resolvedConfig: {
        projectRoot,
        configFilePath: null,
        webServer: {
          command: 'echo "No command configured"',
          port: 5173,
          baseURL: 'http://localhost:5173',
        },
        features: ['features/**/*.feature'],
        steps: ['bdui/steps/**/*.{ts,js}'],
        driver: { kind: 'playwright', browser: 'chromium', headless: true },
        cucumber: { tagExpression: '', order: 'defined' },
        environment: {},
      },
    };

    loadBduiConfigMock.mockResolvedValue(configResult);
    resolveStepFilesFromConfigMock.mockResolvedValue([]);
    runBduiFeaturesMock.mockResolvedValue({ success: true } as BduiRunResult);

    const { registerRunCommand } = await import('../../src/cli/run/command.js');

    const program = new Command();
    registerRunCommand(program);
    program.exitOverride();

    await program.parseAsync([
      'node',
      '/usr/local/bin/bdui',
      'run',
      '--config',
      './custom.ts',
    ]);

    expect(loadBduiConfigMock).toHaveBeenCalled();
    const lastCall = loadBduiConfigMock.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const [options] = lastCall as [LoadBduiConfigOptions | undefined];
    expect(options?.cwd).toBe(process.cwd());
    expect(options?.configPathOverride).toContain('custom.ts');
  });
});
/* eslint-enable max-lines-per-function */
