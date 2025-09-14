/**
 * Configuration system for behavior-driven-ui
 */

import type { BehaviorDrivenUIConfig } from './types.js';

/**
 * Define a configuration for behavior-driven-ui tests
 *
 * @param config - Configuration object
 * @returns The validated configuration
 */
export function defineConfig(
  config: BehaviorDrivenUIConfig
): BehaviorDrivenUIConfig {
  // Basic validation
  if (!config.baseURL) {
    throw new Error('baseURL is required in configuration');
  }

  if (!config.features || config.features.length === 0) {
    throw new Error('features array is required and cannot be empty');
  }

  if (!config.steps || config.steps.length === 0) {
    throw new Error('steps array is required and cannot be empty');
  }

  // Set default values
  const configWithDefaults: BehaviorDrivenUIConfig = {
    ...config,
    driver: {
      kind: 'playwright',
      browser: 'chromium',
      headless: true,
      ...config.driver,
    },
  };

  return configWithDefaults;
}
