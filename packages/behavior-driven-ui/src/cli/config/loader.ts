/* global process */
import { access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { getProjectRoot } from '@nuevco/free-paths';
import { z } from 'zod';

import {
  type BduiCliConfigDef,
  BduiCliConfigDefSchema,
  type BduiCucumberOptionsDef,
  type BduiEnvironmentVariables,
  type BduiResolvedConfigDef,
  BduiResolvedConfigDefSchema,
  type BduiResolvedCucumberOptionsDef,
  type BduiResolvedDriverDef,
} from './interfaces.js';

const CONFIG_FILES_IN_PRIORITY = [
  'bdui.config.ts',
  'bdui.config.mts',
  'bdui.config.cts',
  'bdui.config.js',
  'bdui.config.mjs',
  'bdui.config.cjs',
] as const;

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_FEATURE_GLOBS = ['features/**/*.feature'];
const DEFAULT_STEP_GLOBS = ['bdui/steps/**/*.{ts,js}'];
const DEFAULT_TAG_EXPRESSION = '';
const DEFAULT_CUCUMBER_ORDER = 'defined' as const;
const DEFAULT_DRIVER_BROWSER = 'chromium' as const;
const DEFAULT_DRIVER_HEADLESS = true;

export interface LoadBduiConfigOptions {
  readonly cwd?: string;
  readonly configPathOverride?: string;
}

export interface LoadBduiConfigResult {
  readonly projectRoot: string;
  readonly configFilePath: string | null;
  readonly rawConfig: BduiCliConfigDef | null;
  readonly resolvedConfig: BduiResolvedConfigDef;
}

export class BduiConfigError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause ? { cause } : undefined);
    this.name = 'BduiConfigError';
  }
}

async function fileExists(candidate: string): Promise<boolean> {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

function normalizeGlobInput(
  input: BduiCliConfigDef['features']
): string[] | undefined {
  if (!input) {
    return undefined;
  }

  if (Array.isArray(input)) {
    return input;
  }

  return [input];
}

function normalizeEnvironment(
  input: BduiEnvironmentVariables | undefined
): BduiEnvironmentVariables {
  if (!input) {
    return {};
  }
  return input;
}

function stripUndefinedKeys<T extends Record<string, unknown>>(value: T): T {
  const filteredEntries = Object.entries(value).filter(([, entryValue]) => {
    return entryValue !== undefined;
  });

  return Object.fromEntries(filteredEntries) as T;
}

function resolveProjectRoot(
  discoveredRoot: string,
  configDir: string,
  configOverride?: string
): string {
  if (!configOverride) {
    return discoveredRoot;
  }
  return path.resolve(configDir, configOverride);
}

function resolveDriverConfig(
  input: BduiCliConfigDef['driver'] | undefined
): BduiResolvedDriverDef {
  return {
    browser: input?.browser ?? DEFAULT_DRIVER_BROWSER,
    headless: input?.headless ?? DEFAULT_DRIVER_HEADLESS,
  };
}

function resolveCucumberOptions(
  input: BduiCucumberOptionsDef | undefined
): BduiResolvedCucumberOptionsDef {
  return {
    tagExpression: input?.tagExpression ?? DEFAULT_TAG_EXPRESSION,
    order: input?.order ?? DEFAULT_CUCUMBER_ORDER,
  };
}

function buildResolvedConfig(params: {
  discoveredProjectRoot: string;
  configFilePath: string | null;
  configDir: string;
  config: BduiCliConfigDef | null;
}): BduiResolvedConfigDef {
  const { discoveredProjectRoot, configFilePath, configDir, config } = params;
  const projectRoot = resolveProjectRoot(
    discoveredProjectRoot,
    configDir,
    config?.projectRoot
  );

  const features =
    normalizeGlobInput(config?.features) ?? DEFAULT_FEATURE_GLOBS;
  const steps = normalizeGlobInput(config?.steps) ?? DEFAULT_STEP_GLOBS;
  const driver = resolveDriverConfig(config?.driver);
  const cucumber = resolveCucumberOptions(config?.cucumber);

  const resolvedBase: Omit<BduiResolvedConfigDef, 'webServer'> = {
    projectRoot,
    configFilePath,
    baseURL: config?.baseURL ?? DEFAULT_BASE_URL,
    features,
    steps,
    driver,
    cucumber,
    environment: normalizeEnvironment(config?.environment),
  };

  if (config?.webServer) {
    return BduiResolvedConfigDefSchema.parse({
      ...resolvedBase,
      webServer: config.webServer,
    });
  }

  return BduiResolvedConfigDefSchema.parse(resolvedBase);
}

function isModuleNamespace(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickExportCandidate(namespace: Record<string, unknown>): unknown {
  if (Object.hasOwn(namespace, 'default')) {
    const candidate = namespace.default;
    if (candidate !== undefined) {
      return candidate;
    }
  }

  if (Object.hasOwn(namespace, 'config')) {
    const candidate = namespace.config;
    if (candidate !== undefined) {
      return candidate;
    }
  }

  return namespace;
}

export async function findConfigFile(cwd: string): Promise<string | null> {
  const projectRoot = getProjectRoot(cwd);

  for (const candidate of CONFIG_FILES_IN_PRIORITY) {
    const fullPath = path.join(projectRoot, candidate);
    if (await fileExists(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

async function loadConfigModule(configPath: string): Promise<unknown> {
  try {
    const moduleUrl = pathToFileURL(configPath).href;
    const importedModule: unknown = await import(moduleUrl);

    if (isModuleNamespace(importedModule)) {
      return pickExportCandidate(importedModule);
    }

    return importedModule;
  } catch (error) {
    throw new BduiConfigError(
      `Unable to import configuration file at ${configPath}`,
      error
    );
  }
}

function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const pathLabel = issue.path.length ? issue.path.join('.') : 'root';
      return `${pathLabel}: ${issue.message}`;
    })
    .join('; ');
}

function validateCliConfig(raw: unknown, configPath: string): BduiCliConfigDef {
  const parsed = BduiCliConfigDefSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMessage = formatZodIssues(parsed.error.issues);
    throw new BduiConfigError(
      `Invalid configuration in ${configPath}: ${errorMessage}`,
      parsed.error
    );
  }

  const sanitizedTopLevel = stripUndefinedKeys(parsed.data);

  return {
    ...sanitizedTopLevel,
    ...(sanitizedTopLevel.driver
      ? { driver: stripUndefinedKeys({ ...sanitizedTopLevel.driver }) }
      : {}),
    ...(sanitizedTopLevel.cucumber
      ? { cucumber: stripUndefinedKeys({ ...sanitizedTopLevel.cucumber }) }
      : {}),
    ...(sanitizedTopLevel.webServer
      ? { webServer: stripUndefinedKeys({ ...sanitizedTopLevel.webServer }) }
      : {}),
  };
}

export async function loadBduiConfig(
  options: LoadBduiConfigOptions = {}
): Promise<LoadBduiConfigResult> {
  const cwd = options.cwd ?? process.cwd();
  const projectRoot = getProjectRoot(cwd);

  let configPath: string | null = null;

  if (options.configPathOverride) {
    configPath = path.resolve(projectRoot, options.configPathOverride);
    if (!(await fileExists(configPath))) {
      throw new BduiConfigError(`Configuration file not found: ${configPath}`);
    }
  } else {
    configPath = await findConfigFile(projectRoot);
  }

  if (!configPath) {
    const resolvedConfig = buildResolvedConfig({
      discoveredProjectRoot: projectRoot,
      configFilePath: null,
      configDir: projectRoot,
      config: null,
    });

    return {
      projectRoot,
      configFilePath: null,
      rawConfig: null,
      resolvedConfig,
    };
  }

  const configDir = path.dirname(configPath);
  const rawModule = await loadConfigModule(configPath);
  const rawConfig = validateCliConfig(rawModule, configPath);

  const resolvedConfig = buildResolvedConfig({
    discoveredProjectRoot: projectRoot,
    configFilePath: configPath,
    configDir,
    config: rawConfig,
  });

  return {
    projectRoot,
    configFilePath: configPath,
    rawConfig,
    resolvedConfig,
  };
}
