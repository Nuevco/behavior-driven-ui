import { supportCodeLibraryBuilder } from '@cucumber/cucumber';

import { World } from '../core/world.js';

import type { ParallelAssignmentValidator } from './types.js';

/**
 * Function signature for registering step definitions against the active
 * Cucumber {@link supportCodeLibraryBuilder.methods} instance.
 */
type SupportMethods = typeof supportCodeLibraryBuilder.methods;
export type StepDefinitionRegistrar = (methods: SupportMethods) => void;

function registerCoreSteps(methods: SupportMethods): void {
  methods.setWorldConstructor(World);

  methods.Given('I have a Behavior Driven UI world', function (this: World) {
    // The World constructor validates configuration. If we reach this point we
    // know the runner initialised the world correctly.
  });

  methods.When(
    'I store {string} as {string}',
    function (this: World, key: string, value: string) {
      this.setData(key, value);
    }
  );

  methods.Then(
    'I should be able to retrieve {string} as {string}',
    function (this: World, key: string, expected: string) {
      const actual = this.getData<string>(key);
      if (actual !== expected) {
        throw new Error(
          `Expected ${key} to equal ${expected}, but received ${String(actual)}`
        );
      }
    }
  );

  methods.After(async function (this: World) {
    // Ensure per-scenario data is cleared even if step definitions forget.
    this.clearData();
    await this.driver.destroy();
  });
}

/**
 * Register the built-in Behavior Driven UI world and step definitions using the
 * caller's Cucumber instance.
 */
export const registerBehaviorDrivenUISupport: StepDefinitionRegistrar = (
  methods
) => {
  registerCoreSteps(methods);
};

/**
 * Combine two parallel-assignment validators, ensuring both pass before a
 * pickle is executed.
 */
export function mergeParallelValidators(
  a: ParallelAssignmentValidator,
  b: ParallelAssignmentValidator
): ParallelAssignmentValidator {
  if (a === b) {
    return a;
  }

  return (
    pickle: Parameters<ParallelAssignmentValidator>[0],
    runningPickles: Parameters<ParallelAssignmentValidator>[1]
  ) => a(pickle, runningPickles) && b(pickle, runningPickles);
}
