/**
 * Configuration system for behavior-driven-ui
 * Provides comprehensive configuration validation, merging, and runtime type safety
 */

import type { BehaviorDrivenUIConfig } from './types.js';

/**
 * Configuration validation error class
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Configuration merge error class
 */
export class ConfigMergeError extends Error {
  constructor(
    message: string,
    public readonly conflicts: string[]
  ) {
    super(message);
    this.name = 'ConfigMergeError';
  }
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<BehaviorDrivenUIConfig> = {
  driver: {
    kind: 'playwright',
    browser: 'chromium',
    headless: true,
  },
  breakpoints: {
    source: 'override',
    defaultHeight: 1080,
    override: {
      mobile: 360,
      tablet: 768,
      desktop: 1024,
      wide: 1440,
    },
  },
  mocks: {
    strategy: 'playwright',
    fixturesDir: './fixtures',
  },
};

/**
 * Validates a URL string
 */
function validateURL(url: string, fieldName: string): void {
  try {
    new URL(url);
  } catch {
    throw new ConfigValidationError(
      `${fieldName} must be a valid URL`,
      fieldName,
      url
    );
  }
}

/**
 * Validates an array of file patterns
 */
function validateFilePatterns(patterns: string[], fieldName: string): void {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    throw new ConfigValidationError(
      `${fieldName} must be a non-empty array of file patterns`,
      fieldName,
      patterns
    );
  }

  for (const pattern of patterns) {
    if (typeof pattern !== 'string' || pattern.trim() === '') {
      throw new ConfigValidationError(
        `${fieldName} contains invalid pattern: must be non-empty string`,
        fieldName,
        pattern
      );
    }
  }
}

/**
 * Validates driver configuration
 */
function validateDriverConfig(
  driver: BehaviorDrivenUIConfig['driver'],
  allowPartial = false
): void {
  if (!driver) return;

  if (driver.kind !== undefined) {
    const validKinds = ['playwright', 'mock'] as const;
    if (!validKinds.includes(driver.kind)) {
      throw new ConfigValidationError(
        `driver.kind must be one of: ${validKinds.join(', ')}`,
        'driver.kind',
        driver.kind
      );
    }
  } else if (!allowPartial) {
    throw new ConfigValidationError(
      'driver.kind is required',
      'driver.kind',
      undefined
    );
  }

  if (driver.browser) {
    const validBrowsers = ['chromium', 'firefox', 'webkit'] as const;
    if (!validBrowsers.includes(driver.browser)) {
      throw new ConfigValidationError(
        `driver.browser must be one of: ${validBrowsers.join(', ')}`,
        'driver.browser',
        driver.browser
      );
    }
  }

  if (driver.headless !== undefined && typeof driver.headless !== 'boolean') {
    throw new ConfigValidationError(
      'driver.headless must be a boolean',
      'driver.headless',
      driver.headless
    );
  }
}

/**
 * Validates web server configuration
 */
function validateWebServerConfig(
  webServer: BehaviorDrivenUIConfig['webServer']
): void {
  if (!webServer) return;

  if (!webServer.command || typeof webServer.command !== 'string') {
    throw new ConfigValidationError(
      'webServer.command must be a non-empty string',
      'webServer.command',
      webServer.command
    );
  }

  if (
    typeof webServer.port !== 'number' ||
    webServer.port <= 0 ||
    webServer.port > 65535
  ) {
    throw new ConfigValidationError(
      'webServer.port must be a number between 1 and 65535',
      'webServer.port',
      webServer.port
    );
  }

  if (
    webServer.reuseExistingServer !== undefined &&
    typeof webServer.reuseExistingServer !== 'boolean'
  ) {
    throw new ConfigValidationError(
      'webServer.reuseExistingServer must be a boolean',
      'webServer.reuseExistingServer',
      webServer.reuseExistingServer
    );
  }
}

/**
 * Validates breakpoints configuration
 */
function validateBreakpointsConfig(
  breakpoints: BehaviorDrivenUIConfig['breakpoints']
): void {
  if (!breakpoints) return;

  const validSources = ['mui', 'tailwind', 'override'] as const;
  if (!validSources.includes(breakpoints.source)) {
    throw new ConfigValidationError(
      `breakpoints.source must be one of: ${validSources.join(', ')}`,
      'breakpoints.source',
      breakpoints.source
    );
  }

  if (breakpoints.defaultHeight !== undefined) {
    if (
      typeof breakpoints.defaultHeight !== 'number' ||
      breakpoints.defaultHeight <= 0
    ) {
      throw new ConfigValidationError(
        'breakpoints.defaultHeight must be a positive number',
        'breakpoints.defaultHeight',
        breakpoints.defaultHeight
      );
    }
  }

  if (breakpoints.override) {
    for (const [name, value] of Object.entries(breakpoints.override)) {
      if (typeof value !== 'number' || value <= 0) {
        throw new ConfigValidationError(
          `breakpoints.override.${name} must be a positive number`,
          `breakpoints.override.${name}`,
          value
        );
      }
    }
  }
}

/**
 * Validates mocks configuration
 */
function validateMocksConfig(mocks: BehaviorDrivenUIConfig['mocks']): void {
  if (!mocks) return;

  if (!mocks.fixturesDir || typeof mocks.fixturesDir !== 'string') {
    throw new ConfigValidationError(
      'mocks.fixturesDir must be a non-empty string',
      'mocks.fixturesDir',
      mocks.fixturesDir
    );
  }

  const validStrategies = ['playwright', 'msw'] as const;
  if (!validStrategies.includes(mocks.strategy)) {
    throw new ConfigValidationError(
      `mocks.strategy must be one of: ${validStrategies.join(', ')}`,
      'mocks.strategy',
      mocks.strategy
    );
  }
}

/**
 * Validates the complete configuration object
 */
function validateConfig(config: BehaviorDrivenUIConfig): void {
  // Validate required fields
  if (!config.baseURL || typeof config.baseURL !== 'string') {
    throw new ConfigValidationError(
      'baseURL is required and must be a non-empty string',
      'baseURL',
      config.baseURL
    );
  }

  validateURL(config.baseURL, 'baseURL');
  validateFilePatterns(config.features, 'features');
  validateFilePatterns(config.steps, 'steps');
  validateDriverConfig(config.driver);
  validateWebServerConfig(config.webServer);
  validateBreakpointsConfig(config.breakpoints);
  validateMocksConfig(config.mocks);

  // Validate tags configuration (partial validation only)
  if (config.tags) {
    for (const [tagName, tagConfig] of Object.entries(config.tags)) {
      try {
        // Validate individual tag override properties (not the full merged config)
        if (tagConfig.driver) {
          validateDriverConfig(tagConfig.driver, true);
        }
        if (tagConfig.webServer) {
          validateWebServerConfig(tagConfig.webServer);
        }
        if (tagConfig.breakpoints) {
          validateBreakpointsConfig(tagConfig.breakpoints);
        }
        if (tagConfig.mocks) {
          validateMocksConfig(tagConfig.mocks);
        }
        if (tagConfig.baseURL) {
          validateURL(tagConfig.baseURL, 'baseURL');
        }
        if (tagConfig.features) {
          validateFilePatterns(tagConfig.features, 'features');
        }
        if (tagConfig.steps) {
          validateFilePatterns(tagConfig.steps, 'steps');
        }
      } catch (error) {
        if (error instanceof ConfigValidationError) {
          throw new ConfigValidationError(
            `Invalid configuration in tag "${tagName}": ${error.message}`,
            `tags.${tagName}.${error.field ?? 'unknown'}`,
            error.value
          );
        }
        throw error;
      }
    }
  }
}

/**
 * Deep merge two configuration objects
 */
function mergeConfigs(
  base: Partial<BehaviorDrivenUIConfig>,
  override: Partial<BehaviorDrivenUIConfig>
): BehaviorDrivenUIConfig {
  const result: Partial<BehaviorDrivenUIConfig> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;

    const typedKey = key as keyof BehaviorDrivenUIConfig;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Deep merge objects
      // eslint-disable-next-line security/detect-object-injection
      const baseValue = result[typedKey];
      const mergedValue = {
        ...(typeof baseValue === 'object' && baseValue !== null
          ? baseValue
          : {}),
        ...value,
      };
      // eslint-disable-next-line security/detect-object-injection
      (result as Record<string, unknown>)[typedKey] = mergedValue;
    } else {
      // Direct assignment for primitives and arrays
      // eslint-disable-next-line security/detect-object-injection
      (result as Record<string, unknown>)[typedKey] = value;
    }
  }

  return result as BehaviorDrivenUIConfig;
}

/**
 * Define a configuration for behavior-driven-ui tests
 *
 * This function provides comprehensive validation and merging of configuration options.
 * It ensures type safety at runtime and provides helpful error messages for invalid configurations.
 *
 * @param config - Configuration object with all required and optional settings
 * @returns The validated and normalized configuration with defaults applied
 *
 * @throws {ConfigValidationError} When configuration validation fails
 * @throws {ConfigMergeError} When configuration merging encounters conflicts
 *
 * @example
 * ```typescript
 * import { defineConfig } from 'behavior-driven-ui';
 *
 * const config = defineConfig({
 *   baseURL: 'http://localhost:3000',
 *   features: ['**\/*.feature'],
 *   steps: ['**\/*.steps.ts'],
 *   driver: {
 *     kind: 'playwright',
 *     browser: 'chromium',
 *     headless: true
 *   },
 *   webServer: {
 *     command: 'npm run dev',
 *     port: 3000
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Configuration with tag-based overrides
 * const config = defineConfig({
 *   baseURL: 'http://localhost:3000',
 *   features: ['tests\/**\/*.feature'],
 *   steps: ['tests\/**\/*.steps.ts'],
 *   tags: {
 *     '@mobile': {
 *       breakpoints: {
 *         source: 'override',
 *         override: { mobile: 375 }
 *       }
 *     },
 *     '@headless': {
 *       driver: {
 *         headless: true
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Environment-specific configuration
 * const config = defineConfig({
 *   baseURL: process.env.NODE_ENV === 'production'
 *     ? 'https://app.example.com'
 *     : 'http://localhost:3000',
 *   features: ['**\/*.feature'],
 *   steps: ['**\/*.steps.ts'],
 *   driver: {
 *     kind: 'playwright',
 *     headless: process.env.CI === 'true'
 *   }
 * });
 * ```
 */
export function defineConfig(
  config: BehaviorDrivenUIConfig
): BehaviorDrivenUIConfig {
  // Validate the input configuration
  validateConfig(config);

  try {
    // Merge with defaults
    const configWithDefaults = mergeConfigs(DEFAULT_CONFIG, config);

    // Validate the final merged configuration
    validateConfig(configWithDefaults);

    return configWithDefaults;
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw error;
    }

    throw new ConfigMergeError(
      `Failed to merge configuration: ${error instanceof Error ? error.message : String(error)}`,
      []
    );
  }
}

/**
 * Merge multiple configuration objects with validation
 *
 * Useful for creating configuration presets or combining multiple configuration sources.
 *
 * @param configs - Array of configuration objects to merge (later configs override earlier ones)
 * @returns The merged and validated configuration
 *
 * @throws {ConfigValidationError} When any configuration is invalid
 * @throws {ConfigMergeError} When merging encounters conflicts
 *
 * @example
 * ```typescript
 * import { mergeConfigurations } from 'behavior-driven-ui';
 *
 * const baseConfig = {
 *   baseURL: 'http://localhost:3000',
 *   features: ['**\/*.feature'],
 *   steps: ['**\/*.steps.ts']
 * };
 *
 * const productionOverrides = {
 *   baseURL: 'https://app.example.com',
 *   driver: { headless: true }
 * };
 *
 * const config = mergeConfigurations([baseConfig, productionOverrides]);
 * ```
 */
export function mergeConfigurations(
  configs: Partial<BehaviorDrivenUIConfig>[]
): BehaviorDrivenUIConfig {
  if (configs.length === 0) {
    throw new ConfigValidationError(
      'At least one configuration object is required'
    );
  }

  let result = DEFAULT_CONFIG;

  for (const [index, config] of configs.entries()) {
    try {
      result = mergeConfigs(result, config);
    } catch (error) {
      throw new ConfigMergeError(
        `Failed to merge configuration at index ${index}: ${error instanceof Error ? error.message : String(error)}`,
        [`config[${index}]`]
      );
    }
  }

  // Validate the final result
  validateConfig(result as BehaviorDrivenUIConfig);

  return result as BehaviorDrivenUIConfig;
}
