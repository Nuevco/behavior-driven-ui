import type { Writable } from 'node:stream';

import {
  World as BaseCucumberWorld,
  supportCodeLibraryBuilder,
} from '@cucumber/cucumber';
import {
  type IConfiguration,
  type ILoadConfigurationOptions,
  type IRunEnvironment,
  type IRunOptions,
  loadConfiguration,
  loadSupport,
  runCucumber,
} from '@cucumber/cucumber/api';
import { type Envelope, IdGenerator } from '@cucumber/messages';

import type { WorldConfig } from '../core/types.js';
import { clearWorldConfig, setWorldConfig } from '../core/world.js';

import type { StepDefinitionRegistrar } from './register.js';
import {
  mergeParallelValidators,
  registerBehaviorDrivenUISupport,
} from './register.js';
import type {
  ParameterType,
  ParameterTypeRegistry,
  SupportLibrary,
} from './types.js';

interface EnvironmentOverrides {
  cwd?: string;
  stdout?: Writable;
  stderr?: Writable;
  env?: Record<string, string | undefined>;
  debug?: boolean;
}

export interface RunCucumberWithBduiOptions {
  world: WorldConfig;
  configuration?: ILoadConfigurationOptions;
  environment?: EnvironmentOverrides;
  register?: StepDefinitionRegistrar | StepDefinitionRegistrar[];
  onMessage?: (envelope: Envelope) => void;
}

export interface RunCucumberWithBduiResult {
  success: boolean;
  support: SupportLibrary;
  configuration: IConfiguration;
}

export async function runCucumberWithBdui(
  options: RunCucumberWithBduiOptions
): Promise<RunCucumberWithBduiResult> {
  const { world, configuration, environment, register, onMessage } = options;

  const defaultCwd =
    environment?.cwd ??
    (typeof globalThis.process?.cwd === 'function'
      ? globalThis.process.cwd()
      : '.');

  const env: IRunEnvironment = {
    cwd: defaultCwd,
    debug: environment?.debug ?? false,
  };

  if (environment?.stdout) {
    env.stdout = environment.stdout;
  }

  if (environment?.stderr) {
    env.stderr = environment.stderr;
  }

  if (environment?.env) {
    env.env = environment.env;
  }

  const registrars: StepDefinitionRegistrar[] = [
    registerBehaviorDrivenUISupport,
  ];
  if (register) {
    registrars.push(...(Array.isArray(register) ? register : [register]));
  }

  setWorldConfig(world);

  try {
    const builtinSupport = await buildSupportLibrary(defaultCwd, registrars);

    const configurationResult = await loadConfiguration(configuration, env);
    const userSupportRaw = await loadSupport(
      configurationResult.runConfiguration,
      env
    );
    const userSupport = ensureSupportLibrary(userSupportRaw);
    const support = mergeSupportLibraries(userSupport, builtinSupport);

    const runOptions: IRunOptions = {
      sources: configurationResult.runConfiguration.sources,
      runtime: configurationResult.runConfiguration.runtime,
      formats: configurationResult.runConfiguration.formats,
      support,
    };

    const runResult = await runCucumber(runOptions, env, onMessage);
    const resolvedSupport = ensureSupportLibrary(runResult.support);

    return {
      success: runResult.success,
      support: resolvedSupport,
      configuration: configurationResult.useConfiguration,
    };
  } finally {
    clearWorldConfig();
  }
}

async function buildSupportLibrary(
  cwd: string,
  registrars: StepDefinitionRegistrar[]
): Promise<SupportLibrary> {
  supportCodeLibraryBuilder.reset(cwd, IdGenerator.uuid());

  for (const registrar of registrars) {
    registrar(supportCodeLibraryBuilder.methods);
  }

  return supportCodeLibraryBuilder.finalize();
}

function mergeSupportLibraries(
  user: SupportLibrary,
  builtin: SupportLibrary
): SupportLibrary {
  const parameterTypeRegistry = mergeParameterTypeRegistries(
    user.parameterTypeRegistry,
    builtin.parameterTypeRegistry
  );

  const worldConstructor = resolveWorldConstructor(user.World, builtin.World);

  return {
    ...user,
    originalCoordinates: mergeCoordinates(
      user.originalCoordinates,
      builtin.originalCoordinates
    ),
    afterTestCaseHookDefinitions: [
      ...builtin.afterTestCaseHookDefinitions,
      ...user.afterTestCaseHookDefinitions,
    ],
    afterTestStepHookDefinitions: [
      ...builtin.afterTestStepHookDefinitions,
      ...user.afterTestStepHookDefinitions,
    ],
    afterTestRunHookDefinitions: [
      ...builtin.afterTestRunHookDefinitions,
      ...user.afterTestRunHookDefinitions,
    ],
    beforeTestCaseHookDefinitions: [
      ...builtin.beforeTestCaseHookDefinitions,
      ...user.beforeTestCaseHookDefinitions,
    ],
    beforeTestStepHookDefinitions: [
      ...builtin.beforeTestStepHookDefinitions,
      ...user.beforeTestStepHookDefinitions,
    ],
    beforeTestRunHookDefinitions: [
      ...builtin.beforeTestRunHookDefinitions,
      ...user.beforeTestRunHookDefinitions,
    ],
    defaultTimeout: Math.max(builtin.defaultTimeout, user.defaultTimeout),
    stepDefinitions: [...builtin.stepDefinitions, ...user.stepDefinitions],
    undefinedParameterTypes: [
      ...builtin.undefinedParameterTypes,
      ...user.undefinedParameterTypes,
    ],
    parameterTypeRegistry,
    World: worldConstructor,
    parallelCanAssign: mergeParallelValidators(
      builtin.parallelCanAssign,
      user.parallelCanAssign
    ),
  };
}

function resolveWorldConstructor(
  userWorld: SupportLibrary['World'],
  builtinWorld: SupportLibrary['World']
): SupportLibrary['World'] {
  if (
    typeof userWorld === 'function' &&
    Object.is(userWorld, BaseCucumberWorld as unknown as typeof userWorld)
  ) {
    return builtinWorld;
  }

  return userWorld;
}

function mergeParameterTypeRegistries(
  userRegistry: ParameterTypeRegistry,
  builtinRegistry: ParameterTypeRegistry
): ParameterTypeRegistry {
  for (const parameterType of builtinRegistry.parameterTypes as Iterable<ParameterType>) {
    if (!parameterType?.name) {
      continue;
    }

    if (userRegistry.lookupByTypeName(parameterType.name)) {
      continue;
    }

    const source = builtinRegistry.lookupSource(parameterType);
    userRegistry.defineSourcedParameterType(parameterType, source);
  }

  return userRegistry;
}

function mergeCoordinates(
  user: SupportLibrary['originalCoordinates'],
  builtin: SupportLibrary['originalCoordinates']
): SupportLibrary['originalCoordinates'] {
  const combine = (values: string[] = [], extras: string[] = []) => [
    ...new Set([...extras, ...values]),
  ];

  return {
    requireModules: combine(user.requireModules, builtin.requireModules),
    requirePaths: combine(user.requirePaths, builtin.requirePaths),
    importPaths: combine(user.importPaths, builtin.importPaths),
    loaders: combine(user.loaders, builtin.loaders),
  };
}

function ensureSupportLibrary(value: unknown): SupportLibrary {
  if (isSupportLibrary(value)) {
    return value;
  }

  throw new Error('Failed to resolve a valid Cucumber support code library');
}

function isSupportLibrary(candidate: unknown): candidate is SupportLibrary {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const library = candidate as Partial<SupportLibrary>;

  return (
    Array.isArray(library.afterTestCaseHookDefinitions) &&
    Array.isArray(library.afterTestStepHookDefinitions) &&
    Array.isArray(library.afterTestRunHookDefinitions) &&
    Array.isArray(library.beforeTestCaseHookDefinitions) &&
    Array.isArray(library.beforeTestStepHookDefinitions) &&
    Array.isArray(library.beforeTestRunHookDefinitions) &&
    Array.isArray(library.stepDefinitions) &&
    typeof library.parameterTypeRegistry === 'object' &&
    library.parameterTypeRegistry !== null &&
    typeof library.parallelCanAssign === 'function'
  );
}
