/* global process, console, setTimeout, clearTimeout */
import path from 'node:path';

import { runBduiFeatures } from '../../cucumber/index.js';
import type { BduiRunOptions } from '../../cucumber/index.js';
import { ServerManager } from '../../core/server-manager.js';
import { globalConfigManager } from '../../core/config-manager.js';
import type {
  LoadBduiConfigOptions,
  LoadBduiConfigResult,
} from '../config/loader.js';
import { ensureLoadersRegistered } from '../runtime/register-loaders.js';
import { resolveStepFilesFromConfig } from '../steps/resolve-step-files.js';

const ENV_KEY_PATTERN = /^[A-Z0-9_]+$/i;

export interface ExecuteRunOptions {
  readonly config?: string;
  readonly cwd?: string;
}

export interface ExecuteRunResult {
  readonly config: LoadBduiConfigResult;
  readonly stepFiles: string[];
  readonly runResult: Awaited<ReturnType<typeof runBduiFeatures>>;
}

function resolveConfigOverride(
  overridePath: string | undefined,
  cwd: string
): string | undefined {
  if (!overridePath) {
    return undefined;
  }

  if (path.isAbsolute(overridePath)) {
    return overridePath;
  }

  return path.resolve(cwd, overridePath);
}

function applyEnvironment(
  environment: LoadBduiConfigResult['resolvedConfig']['environment']
): () => void {
  const originalValues = new Map<string, string | undefined>();

  for (const [rawKey, value] of Object.entries(environment)) {
    const key = String(rawKey);
    if (!ENV_KEY_PATTERN.test(key)) {
      throw new Error(`Invalid environment variable name: ${key}`);
    }

    // eslint-disable-next-line security/detect-object-injection
    originalValues.set(key, process.env[key]);
    // eslint-disable-next-line security/detect-object-injection
    process.env[key] = value;
  }

  return () => {
    for (const [key, original] of originalValues.entries()) {
      if (typeof original === 'string') {
        // eslint-disable-next-line security/detect-object-injection
        process.env[key] = original;
      } else {
        Reflect.deleteProperty(process.env, key);
      }
    }
  };
}

async function executeRunCore(
  options: ExecuteRunOptions = {}
): Promise<ExecuteRunResult> {
  const cwd = options.cwd ?? process.cwd();
  const configPathOverride = resolveConfigOverride(options.config, cwd);

  const loaderOptions: LoadBduiConfigOptions = configPathOverride
    ? { cwd, configPathOverride }
    : { cwd };

  await ensureLoadersRegistered();

  await globalConfigManager.loadConfig(loaderOptions);

  const stepFiles = await resolveStepFilesFromConfig(
    globalConfigManager.getLoadedConfigResult().resolvedConfig.projectRoot,
    globalConfigManager.getLoadedConfigResult().resolvedConfig.steps
  );

  const cleanupEnvironment = applyEnvironment(
    globalConfigManager.getLoadedConfigResult().resolvedConfig.environment
  );

  let serverManager: ServerManager | null = null;

  try {
    // Start development server if configured
    if (globalConfigManager.getConfig().webServer) {
      serverManager = new ServerManager();
      serverManager.setupSignalHandlers();

      const serverInfo = await serverManager.start();
      // eslint-disable-next-line no-console
      console.log(`[bdui] Development server started at ${serverInfo.url}`);
      // eslint-disable-next-line no-console
      console.log(
        `[bdui] ConfigManager updated with detected server: ${serverInfo.url}`
      );
    }
    const supportCoordinates = stepFiles.length
      ? { importPaths: stepFiles }
      : undefined;

    const runOptions: BduiRunOptions = {
      cwd: globalConfigManager.getLoadedConfigResult().resolvedConfig
        .projectRoot,
      features: [
        ...globalConfigManager.getLoadedConfigResult().resolvedConfig.features,
      ],
      config: globalConfigManager.getConfig(),
      sources: {
        tagExpression:
          globalConfigManager.getLoadedConfigResult().resolvedConfig.cucumber
            .tagExpression,
        order:
          globalConfigManager.getLoadedConfigResult().resolvedConfig.cucumber
            .order,
      },
    };

    if (supportCoordinates) {
      runOptions.support = supportCoordinates;
    }

    const runResult = await runBduiFeatures(runOptions);

    if (!runResult.success && typeof process.exitCode !== 'number') {
      process.exitCode = 1;
    }

    return {
      config: globalConfigManager.getLoadedConfigResult(),
      stepFiles,
      runResult,
    };
  } finally {
    cleanupEnvironment();

    // Stop the development server if it was started
    if (serverManager) {
      await serverManager.stop();
    }

    // In CI environments, force exit after cleanup to prevent hanging
    if (process.env.CI) {
      // Give a brief moment for any remaining cleanup, then force exit
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log(
          '[bdui] CI environment detected - forcing exit after cleanup'
        );

        // Dump wtfnode info before forced exit to see what's still active
        try {
          // Dynamic import to check if wtfnode is available
          import('wtfnode')
            .then((wtf: { dump(): void }) => {
              // eslint-disable-next-line no-console
              console.log('[bdui] Dumping wtfnode info before forced exit:');
              wtf.dump();
              return process.exit(process.exitCode ?? 0);
            })
            .catch(() => {
              // wtfnode not available, just exit normally
              return process.exit(process.exitCode ?? 0);
            });
        } catch {
          // Fallback if dynamic import fails
          process.exit(process.exitCode ?? 0);
        }
      }, 1000);
    }
  }
}

/**
 * Execute BDUI run with hard timeout to prevent CI hanging
 */
export async function executeRun(
  options: ExecuteRunOptions = {}
): Promise<ExecuteRunResult> {
  const timeoutMs = 15 * 60 * 1000; // 15 minutes default timeout

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isTimedOut = false;

  try {
    // Race between execution and timeout
    const result = await Promise.race([
      executeRunCore(options),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          isTimedOut = true;
          // eslint-disable-next-line no-console
          console.error(
            `[bdui] HARD TIMEOUT: Process exceeded ${timeoutMs / 1000}s limit. Forcing exit.`
          );

          // Set exit code and reject instead of hard exit
          process.exitCode = 1;
          reject(new Error(`Execution timeout after ${timeoutMs / 1000}s`));
        }, timeoutMs);
      }),
    ]);

    return result;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // If we timed out, force exit after cleanup
    if (isTimedOut) {
      // Give a brief moment for any cleanup, then hard exit
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.error('[bdui] Force exiting due to timeout');

        // Dump wtfnode info before timeout exit to see what caused the hang
        try {
          import('wtfnode')
            .then((wtf: { dump(): void }) => {
              // eslint-disable-next-line no-console
              console.log('[bdui] Dumping wtfnode info due to timeout:');
              wtf.dump();
              // Force exit to prevent CI hanging - this is intentional
              return process.exit(1);
            })
            .catch(() => {
              // wtfnode not available, just exit
              return process.exit(1);
            });
        } catch {
          // Fallback if dynamic import fails
          process.exit(1);
        }
      }, 1000);
    }
  }
}
