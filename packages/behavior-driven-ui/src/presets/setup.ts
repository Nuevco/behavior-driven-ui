/**
 * Setup helper that registers step definitions using user's Cucumber instance
 * This avoids the dual instance problem by importing from user's installation
 */

import type { World } from '../core/world.js';

export async function registerSteps(): Promise<void> {
  try {
    // Use dynamic import instead of require to avoid ES module issues
    const cucumberModule = await import('@cucumber/cucumber');
    const { Given, When, Then } = cucumberModule;

    Given('I have a test world', function (this: World) {
      // Basic world validation step
    });

    When(
      'I store {string} as {string}',
      function (this: World, key: string, value: string) {
        this.setData(key, value);
      }
    );

    Then(
      'I should be able to retrieve {string} as {string}',
      function (this: World, key: string, expectedValue: string) {
        const actualValue = this.getData<string>(key);
        if (actualValue !== expectedValue) {
          throw new Error(
            `Expected ${key} to be ${expectedValue}, but got ${actualValue}`
          );
        }
      }
    );
  } catch (error) {
    throw new Error(
      `Failed to import @cucumber/cucumber: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
