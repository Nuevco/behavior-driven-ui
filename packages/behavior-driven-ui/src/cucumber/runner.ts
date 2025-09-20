/* global process */
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  type IRunOptions,
  type IRunOptionsFormats,
  type IRunOptionsRuntime,
  type IRunResult,
  type ISupportCodeCoordinates,
  type ISupportCodeLibrary,
  runCucumber,
} from '@cucumber/cucumber/api';
import { IdGenerator } from '@cucumber/messages';

import type { BehaviorDrivenUIConfig } from '../core/types.js';

import type { StepDefinitionMethods } from './steps/core-steps.js';
import { registerCoreStepLibrary } from './steps/core-steps.js';

export interface BduiRunOptions {
  cwd?: string;
  features: string[];
  support?: Partial<ISupportCodeCoordinates>;
  runtime?: Partial<IRunOptionsRuntime>;
  formats?: Partial<IRunOptionsFormats>;
  config?: Partial<BehaviorDrivenUIConfig>;
}

export type BduiRunResult = IRunResult;

type RequiredSupportCoordinates = Required<
  Pick<
    ISupportCodeCoordinates,
    'requireModules' | 'requirePaths' | 'importPaths' | 'loaders'
  >
>;

type NewId = ReturnType<typeof IdGenerator.uuid>;

interface SupportCodeLibraryBuilder {
  readonly methods: StepDefinitionMethods;
  reset(
    cwd: string,
    newId: NewId,
    coordinates: RequiredSupportCoordinates
  ): void;
  finalize(): ISupportCodeLibrary;
}

interface SupportCodeLibraryBuilderModule {
  default: SupportCodeLibraryBuilder;
}

const DEFAULT_SOURCES = {
  defaultDialect: 'en',
  names: [] as string[],
  order: 'defined' as const,
  tagExpression: '',
};

function resolveBuilderModulePath(
  requireFromModule: ReturnType<typeof createRequire>
): string {
  const cucumberPackagePath = requireFromModule.resolve(
    '@cucumber/cucumber/package.json'
  );
  return path.join(
    path.dirname(cucumberPackagePath),
    'lib',
    'support_code_library_builder',
    'index.js'
  );
}

async function loadSupportBuilder(
  modulePath: string
): Promise<SupportCodeLibraryBuilder> {
  const module = (await import(pathToFileURL(modulePath).href)) as
    | SupportCodeLibraryBuilderModule
    | { default: SupportCodeLibraryBuilderModule };

  const candidate = 'default' in module ? module.default : module;
  if ('reset' in candidate) {
    return candidate;
  }

  const nestedDefault = (candidate as { default?: SupportCodeLibraryBuilder })
    .default;
  if (nestedDefault && 'reset' in nestedDefault) {
    return nestedDefault;
  }

  throw new Error('Unable to load Cucumber support library builder module.');
}

function normalizeSupportCoordinates(
  support?: Partial<ISupportCodeCoordinates>
): RequiredSupportCoordinates {
  return {
    requireModules: support?.requireModules ?? [],
    requirePaths: support?.requirePaths ?? [],
    importPaths: support?.importPaths ?? [],
    loaders: support?.loaders ?? [],
  };
}

function createRunOptions(
  options: BduiRunOptions,
  support: ISupportCodeLibrary
): IRunOptions {
  return {
    sources: {
      ...DEFAULT_SOURCES,
      paths: options.features,
    },
    support,
    runtime: {
      dryRun: false,
      failFast: false,
      filterStacktraces: true,
      parallel: 0,
      retry: 0,
      retryTagFilter: '',
      strict: true,
      worldParameters: {},
      ...(options.runtime ?? {}),
    },
    formats: {
      stdout: options.formats?.stdout ?? 'progress',
      files: options.formats?.files ?? {},
      publish: options.formats?.publish ?? false,
      options: options.formats?.options ?? {},
    },
  };
}

export async function runBduiFeatures(
  options: BduiRunOptions
): Promise<BduiRunResult> {
  if (!options.features.length) {
    throw new Error(
      'At least one feature path must be provided to runBduiFeatures'
    );
  }

  const cwd = options.cwd ?? process.cwd();
  const requireFromModule = createRequire(import.meta.url);
  const builderModulePath = resolveBuilderModulePath(requireFromModule);
  const supportBuilder = await loadSupportBuilder(builderModulePath);

  const newId = IdGenerator.uuid();
  supportBuilder.reset(
    cwd,
    newId,
    normalizeSupportCoordinates(options.support)
  );

  registerCoreStepLibrary(
    supportBuilder.methods,
    options.config ? { defaultConfig: options.config } : undefined
  );

  const supportLibrary = supportBuilder.finalize();
  const runOptions = createRunOptions(options, supportLibrary);

  return runCucumber(runOptions, { cwd });
}
