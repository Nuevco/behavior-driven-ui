/**
 * ConfigValidator - Centralized configuration validation
 *
 * This class encapsulates all configuration validation logic,
 * providing a clean interface for validating BDUI configurations.
 */

import type { BehaviorDrivenUIConfig } from './types.js';
import { ConfigValidationError } from './config.js';

/**
 * Interface for configuration validation operations
 */
export interface IConfigValidator {
  /**
   * Validates a complete configuration object
   * @param config - The configuration to validate
   * @throws {ConfigValidationError} When validation fails
   */
  validateConfig(config: BehaviorDrivenUIConfig): void;

  /**
   * Validates a URL string
   * @param url - The URL to validate
   * @param fieldName - Name of the field for error messages
   * @throws {ConfigValidationError} When URL is invalid
   */
  validateURL(url: string, fieldName: string): void;

  /**
   * Validates file pattern arrays
   * @param patterns - Array of file patterns to validate
   * @param fieldName - Name of the field for error messages
   * @throws {ConfigValidationError} When patterns are invalid
   */
  validateFilePatterns(patterns: string[], fieldName: string): void;

  /**
   * Validates driver configuration
   * @param driver - Driver config to validate
   * @throws {ConfigValidationError} When driver config is invalid
   */
  validateDriverConfig(driver: BehaviorDrivenUIConfig['driver']): void;

  /**
   * Validates web server configuration
   * @param webServer - Web server config to validate
   * @throws {ConfigValidationError} When web server config is invalid
   */
  validateWebServerConfig(webServer: BehaviorDrivenUIConfig['webServer']): void;

  /**
   * Validates breakpoints configuration
   * @param breakpoints - Breakpoints config to validate
   * @throws {ConfigValidationError} When breakpoints config is invalid
   */
  validateBreakpointsConfig(
    breakpoints: BehaviorDrivenUIConfig['breakpoints']
  ): void;

  /**
   * Validates mocks configuration
   * @param mocks - Mocks config to validate
   * @throws {ConfigValidationError} When mocks config is invalid
   */
  validateMocksConfig(mocks: BehaviorDrivenUIConfig['mocks']): void;

  /**
   * Validates a single tag configuration
   * @param tagName - Name of the tag
   * @param tagConfig - Tag configuration to validate
   * @throws {ConfigValidationError} When tag config is invalid
   */
  validateTagConfig(
    tagName: string,
    tagConfig: NonNullable<BehaviorDrivenUIConfig['tags']>[string]
  ): void;
}

/**
 * ConfigValidator implementation
 * Provides comprehensive validation for BDUI configurations
 */
export class ConfigValidator implements IConfigValidator {
  /**
   * Validates the complete configuration object
   */
  public validateConfig(config: BehaviorDrivenUIConfig): void {
    // Validate required fields
    if (
      !config.webServer.baseURL ||
      typeof config.webServer.baseURL !== 'string'
    ) {
      throw new ConfigValidationError(
        'webServer.baseURL is required and must be a non-empty string',
        'webServer.baseURL',
        config.webServer.baseURL
      );
    }

    this.validateURL(config.webServer.baseURL, 'webServer.baseURL');
    this.validateFilePatterns(config.features, 'features');
    this.validateFilePatterns(config.steps, 'steps');
    this.validateDriverConfig(config.driver);
    this.validateWebServerConfig(config.webServer);
    this.validateBreakpointsConfig(config.breakpoints);
    this.validateMocksConfig(config.mocks);

    // Validate tags configuration (partial validation only)
    if (config.tags) {
      for (const [tagName, tagConfig] of Object.entries(config.tags)) {
        this.validateTagConfig(tagName, tagConfig);
      }
    }
  }

  /**
   * Validates a URL string for proper format and protocol
   */
  public validateURL(url: string, fieldName: string): void {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new ConfigValidationError(
          `${fieldName} must use http or https protocol`,
          fieldName,
          url
        );
      }
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        throw error;
      }
      throw new ConfigValidationError(
        `${fieldName} must be a valid URL`,
        fieldName,
        url
      );
    }
  }

  /**
   * Validates file pattern arrays
   */
  public validateFilePatterns(patterns: string[], fieldName: string): void {
    if (!Array.isArray(patterns)) {
      throw new ConfigValidationError(
        `${fieldName} must be an array of strings`,
        fieldName,
        patterns
      );
    }

    if (patterns.length === 0) {
      throw new ConfigValidationError(
        `${fieldName} must contain at least one pattern`,
        fieldName,
        patterns
      );
    }

    for (const [index, pattern] of patterns.entries()) {
      if (typeof pattern !== 'string' || pattern.trim() === '') {
        throw new ConfigValidationError(
          `${fieldName}[${index}] must be a non-empty string`,
          `${fieldName}[${index}]`,
          pattern
        );
      }
    }
  }

  /**
   * Validates driver configuration
   */
  public validateDriverConfig(driver: BehaviorDrivenUIConfig['driver']): void {
    if (!driver || typeof driver !== 'object') {
      throw new ConfigValidationError(
        'driver configuration is required',
        'driver',
        driver
      );
    }

    if (!driver.kind || typeof driver.kind !== 'string') {
      throw new ConfigValidationError(
        'driver.kind is required and must be a string',
        'driver.kind',
        driver.kind
      );
    }

    const validDrivers = ['playwright'];
    if (!validDrivers.includes(driver.kind)) {
      throw new ConfigValidationError(
        `driver.kind must be one of: ${validDrivers.join(', ')}`,
        'driver.kind',
        driver.kind
      );
    }

    if (driver.kind === 'playwright') {
      if (driver.browser && typeof driver.browser !== 'string') {
        throw new ConfigValidationError(
          'driver.browser must be a string when specified',
          'driver.browser',
          driver.browser
        );
      }

      if (
        driver.headless !== undefined &&
        typeof driver.headless !== 'boolean'
      ) {
        throw new ConfigValidationError(
          'driver.headless must be a boolean when specified',
          'driver.headless',
          driver.headless
        );
      }
    }
  }

  /**
   * Validates web server configuration
   */
  public validateWebServerConfig(
    webServer: BehaviorDrivenUIConfig['webServer']
  ): void {
    if (!webServer || typeof webServer !== 'object') {
      throw new ConfigValidationError(
        'webServer configuration is required',
        'webServer',
        webServer
      );
    }

    // baseURL is validated in main validateConfig method

    if (webServer.command !== undefined) {
      if (
        typeof webServer.command !== 'string' ||
        webServer.command.trim() === ''
      ) {
        throw new ConfigValidationError(
          'webServer.command must be a non-empty string when specified',
          'webServer.command',
          webServer.command
        );
      }
    }

    if (webServer.port !== undefined) {
      if (
        typeof webServer.port !== 'number' ||
        webServer.port < 1 ||
        webServer.port > 65535 ||
        !Number.isInteger(webServer.port)
      ) {
        throw new ConfigValidationError(
          'webServer.port must be a valid port number (1-65535)',
          'webServer.port',
          webServer.port
        );
      }
    }
  }

  /**
   * Validates breakpoints configuration
   */
  public validateBreakpointsConfig(
    breakpoints: BehaviorDrivenUIConfig['breakpoints']
  ): void {
    this.validateBreakpointsStructure(breakpoints);
    this.validateBreakpointsSource(breakpoints);
    this.validateBreakpointsHeight(breakpoints);
    this.validateBreakpointsOverrides(breakpoints);
  }

  private validateBreakpointsStructure(
    breakpoints: BehaviorDrivenUIConfig['breakpoints']
  ): void {
    if (!breakpoints || typeof breakpoints !== 'object') {
      throw new ConfigValidationError(
        'breakpoints configuration is required',
        'breakpoints',
        breakpoints
      );
    }
  }

  private validateBreakpointsSource(
    breakpoints: BehaviorDrivenUIConfig['breakpoints']
  ): void {
    if (!breakpoints?.source || typeof breakpoints.source !== 'string') {
      throw new ConfigValidationError(
        'breakpoints.source is required',
        'breakpoints.source',
        breakpoints?.source
      );
    }

    const validSources = ['override', 'tailwind', 'bootstrap', 'custom'];
    if (!validSources.includes(breakpoints.source)) {
      throw new ConfigValidationError(
        `breakpoints.source must be one of: ${validSources.join(', ')}`,
        'breakpoints.source',
        breakpoints.source
      );
    }
  }

  private validateBreakpointsHeight(
    breakpoints: BehaviorDrivenUIConfig['breakpoints']
  ): void {
    if (breakpoints?.defaultHeight !== undefined) {
      if (
        typeof breakpoints.defaultHeight !== 'number' ||
        breakpoints.defaultHeight <= 0 ||
        !Number.isInteger(breakpoints.defaultHeight)
      ) {
        throw new ConfigValidationError(
          'breakpoints.defaultHeight must be a positive integer',
          'breakpoints.defaultHeight',
          breakpoints.defaultHeight
        );
      }
    }
  }

  private validateBreakpointsOverrides(
    breakpoints: BehaviorDrivenUIConfig['breakpoints']
  ): void {
    if (
      breakpoints &&
      breakpoints.source === 'override' &&
      breakpoints.override
    ) {
      for (const [breakpoint, width] of Object.entries(breakpoints.override)) {
        if (
          typeof width !== 'number' ||
          width <= 0 ||
          !Number.isInteger(width)
        ) {
          throw new ConfigValidationError(
            `breakpoints.override.${breakpoint} must be a positive integer`,
            `breakpoints.override.${breakpoint}`,
            width
          );
        }
      }
    }
  }

  /**
   * Validates mocks configuration
   */
  public validateMocksConfig(mocks: BehaviorDrivenUIConfig['mocks']): void {
    if (mocks === undefined || mocks === null) {
      return; // Mocks are optional
    }

    if (typeof mocks !== 'object') {
      throw new ConfigValidationError(
        'mocks must be an object when specified',
        'mocks',
        mocks
      );
    }

    for (const [mockKey, mockConfig] of Object.entries(mocks)) {
      if (!mockConfig || typeof mockConfig !== 'object') {
        throw new ConfigValidationError(
          `mocks.${mockKey} must be an object`,
          `mocks.${mockKey}`,
          mockConfig
        );
      }

      if (
        'enabled' in mockConfig &&
        (mockConfig as { enabled?: unknown }).enabled !== undefined &&
        typeof (mockConfig as { enabled?: unknown }).enabled !== 'boolean'
      ) {
        throw new ConfigValidationError(
          `mocks.${mockKey}.enabled must be a boolean when specified`,
          `mocks.${mockKey}.enabled`,
          (mockConfig as { enabled?: unknown }).enabled
        );
      }
    }
  }

  /**
   * Validates a single tag configuration
   */
  public validateTagConfig(
    tagName: string,
    tagConfig: NonNullable<BehaviorDrivenUIConfig['tags']>[string]
  ): void {
    if (!tagConfig || typeof tagConfig !== 'object') {
      throw new ConfigValidationError(
        `Tag "${tagName}" configuration must be an object`,
        `tags.${tagName}`,
        tagConfig
      );
    }
  }
}

/**
 * Default export singleton instance
 */
export const configValidator = new ConfigValidator();

/**
 * Factory function to get the ConfigValidator instance
 */
export function getConfigValidator(): IConfigValidator {
  return configValidator;
}
