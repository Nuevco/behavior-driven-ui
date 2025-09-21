/* global process */
import path from 'node:path';

import { runBduiFeatures } from '../../cucumber/index.js';
import type { BduiRunOptions } from '../../cucumber/index.js';
import type { BehaviorDrivenUIConfig } from '../../core/types.js';
import { loadBduiConfig } from '../config/loader.js';
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

function buildBehaviorConfig(
  resolvedConfig: LoadBduiConfigResult['resolvedConfig']
): Partial<BehaviorDrivenUIConfig> {
  const baseConfig: Partial<BehaviorDrivenUIConfig> = {
    baseURL: resolvedConfig.baseURL,
    features: [...resolvedConfig.features],
    steps: [...resolvedConfig.steps],
    driver: {
      kind: resolvedConfig.driver.kind,
      browser: resolvedConfig.driver.browser,
      headless: resolvedConfig.driver.headless,
    },
  };

  if (resolvedConfig.webServer) {
    const { reuseExistingServer, ...rest } = resolvedConfig.webServer;
    baseConfig.webServer = {
      ...rest,
      ...(reuseExistingServer !== undefined ? { reuseExistingServer } : {}),
    };
  }

  return baseConfig;
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

export async function executeRun(
  options: ExecuteRunOptions = {}
): Promise<ExecuteRunResult> {
  const cwd = options.cwd ?? process.cwd();
  const configPathOverride = resolveConfigOverride(options.config, cwd);

  const loaderOptions: LoadBduiConfigOptions = configPathOverride
    ? { cwd, configPathOverride }
    : { cwd };

  await ensureLoadersRegistered();

  const configResult = await loadBduiConfig(loaderOptions);

  const stepFiles = await resolveStepFilesFromConfig(
    configResult.resolvedConfig.projectRoot,
    configResult.resolvedConfig.steps
  );

  const cleanupEnvironment = applyEnvironment(
    configResult.resolvedConfig.environment
  );

  try {
    const supportCoordinates = stepFiles.length
      ? { importPaths: stepFiles }
      : undefined;

    const runOptions: BduiRunOptions = {
      cwd: configResult.resolvedConfig.projectRoot,
      features: [...configResult.resolvedConfig.features],
      config: buildBehaviorConfig(configResult.resolvedConfig),
      sources: {
        tagExpression: configResult.resolvedConfig.cucumber.tagExpression,
        order: configResult.resolvedConfig.cucumber.order,
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
      config: configResult,
      stepFiles,
      runResult,
    };
  } finally {
    cleanupEnvironment();
  }
}
