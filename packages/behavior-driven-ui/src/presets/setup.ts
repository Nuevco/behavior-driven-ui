/**
 * Setup helper that registers step definitions using user's Cucumber instance
 * This avoids the dual instance problem by importing from user's installation
 */

import { hasWorldConfig, setWorldConfig } from '../core/world.js';
import { registerBehaviorDrivenUISupport } from '../cucumber/register.js';

export async function registerSteps(): Promise<void> {
  try {
    const { supportCodeLibraryBuilder } = await import('@cucumber/cucumber');

    if (!hasWorldConfig()) {
      setWorldConfig({
        config: {
          baseURL: '',
          features: [],
          steps: [],
        },
      });
    }

    registerBehaviorDrivenUISupport(supportCodeLibraryBuilder.methods);
  } catch (error) {
    throw new Error(
      `Failed to import @cucumber/cucumber: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
