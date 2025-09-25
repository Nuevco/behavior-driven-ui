/**
 * Tests for ConfigValidator - centralized configuration validation
 */

/* eslint-disable max-lines-per-function */

import { beforeEach, describe, expect, it } from 'vitest';

import { ConfigValidator, getConfigValidator } from './config-validator.js';
import { ConfigValidationError } from './config.js';
import type { BehaviorDrivenUIConfig } from './types.js';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('singleton behavior', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = getConfigValidator();
      const instance2 = getConfigValidator();
      expect(instance1).toBe(instance2);
    });

    it('should be an instance of ConfigValidator', () => {
      const instance = getConfigValidator();
      expect(instance).toBeInstanceOf(ConfigValidator);
    });
  });

  describe('validateURL', () => {
    it('should validate HTTP URLs', () => {
      expect(() =>
        validator.validateURL('http://localhost:3000', 'testURL')
      ).not.toThrow();
    });

    it('should validate HTTPS URLs', () => {
      expect(() =>
        validator.validateURL('https://example.com', 'testURL')
      ).not.toThrow();
    });

    it('should reject non-HTTP protocols', () => {
      expect(() =>
        validator.validateURL('ftp://example.com', 'testURL')
      ).toThrow(ConfigValidationError);
    });

    it('should reject malformed URLs', () => {
      expect(() => validator.validateURL('not-a-url', 'testURL')).toThrow(
        ConfigValidationError
      );
    });

    it('should include field name in error message', () => {
      try {
        validator.validateURL('not-a-url', 'baseURL');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).message).toContain('baseURL');
      }
    });
  });

  describe('validateFilePatterns', () => {
    it('should validate array of strings', () => {
      const patterns = ['**/*.feature', 'tests/**/*.ts'];
      expect(() =>
        validator.validateFilePatterns(patterns, 'features')
      ).not.toThrow();
    });

    it('should reject non-arrays', () => {
      expect(() =>
        validator.validateFilePatterns(
          'not-array' as unknown as string[],
          'features'
        )
      ).toThrow(ConfigValidationError);
    });

    it('should reject empty arrays', () => {
      expect(() => validator.validateFilePatterns([], 'features')).toThrow(
        ConfigValidationError
      );
    });

    it('should reject arrays with non-string elements', () => {
      expect(() =>
        validator.validateFilePatterns(
          ['valid', 123 as unknown as string],
          'features'
        )
      ).toThrow(ConfigValidationError);
    });

    it('should reject arrays with empty string elements', () => {
      expect(() =>
        validator.validateFilePatterns(['valid', ''], 'features')
      ).toThrow(ConfigValidationError);
    });
  });

  describe('validateDriverConfig', () => {
    it('should validate playwright driver config', () => {
      const driver = {
        kind: 'playwright' as const,
        browser: 'chromium',
        headless: true,
      };
      expect(() => validator.validateDriverConfig(driver)).not.toThrow();
    });

    it('should require driver object', () => {
      expect(() =>
        validator.validateDriverConfig(
          null as unknown as BehaviorDrivenUIConfig['driver']
        )
      ).toThrow(ConfigValidationError);
    });

    it('should require driver.kind', () => {
      const driver = {
        browser: 'chromium',
      } as unknown as BehaviorDrivenUIConfig['driver'];
      expect(() => validator.validateDriverConfig(driver)).toThrow(
        ConfigValidationError
      );
    });

    it('should validate driver.kind values', () => {
      const driver = {
        kind: 'invalid-driver',
      } as unknown as BehaviorDrivenUIConfig['driver'];
      expect(() => validator.validateDriverConfig(driver)).toThrow(
        ConfigValidationError
      );
    });

    it('should validate playwright-specific options', () => {
      const invalidBrowser = {
        kind: 'playwright',
        browser: 123,
      } as unknown as BehaviorDrivenUIConfig['driver'];
      expect(() => validator.validateDriverConfig(invalidBrowser)).toThrow(
        ConfigValidationError
      );

      const invalidHeadless = {
        kind: 'playwright',
        headless: 'yes',
      } as unknown as BehaviorDrivenUIConfig['driver'];
      expect(() => validator.validateDriverConfig(invalidHeadless)).toThrow(
        ConfigValidationError
      );
    });
  });

  describe('validateWebServerConfig', () => {
    it('should validate complete web server config', () => {
      const webServer = {
        baseURL: 'http://localhost:3000',
        command: 'npm start',
        port: 3000,
      };
      expect(() => validator.validateWebServerConfig(webServer)).not.toThrow();
    });

    it('should require web server object', () => {
      expect(() =>
        validator.validateWebServerConfig(
          null as unknown as BehaviorDrivenUIConfig['webServer']
        )
      ).toThrow(ConfigValidationError);
    });

    it('should validate command when provided', () => {
      const webServer = {
        baseURL: 'http://localhost:3000',
        command: '',
        port: 3000,
      };
      expect(() => validator.validateWebServerConfig(webServer)).toThrow(
        ConfigValidationError
      );
    });

    it('should validate port numbers', () => {
      const invalidPort = {
        baseURL: 'http://localhost:3000',
        port: -1,
      };
      expect(() => validator.validateWebServerConfig(invalidPort)).toThrow(
        ConfigValidationError
      );

      const tooHighPort = {
        baseURL: 'http://localhost:3000',
        port: 65536,
      };
      expect(() => validator.validateWebServerConfig(tooHighPort)).toThrow(
        ConfigValidationError
      );
    });
  });

  describe('validateBreakpointsConfig', () => {
    it('should validate breakpoints config with override source', () => {
      const breakpoints = {
        source: 'override' as const,
        defaultHeight: 1080,
        override: {
          mobile: 360,
          desktop: 1024,
        },
      };
      expect(() =>
        validator.validateBreakpointsConfig(breakpoints)
      ).not.toThrow();
    });

    it('should require breakpoints object', () => {
      expect(() =>
        validator.validateBreakpointsConfig(
          null as unknown as BehaviorDrivenUIConfig['breakpoints']
        )
      ).toThrow(ConfigValidationError);
    });

    it('should require source field', () => {
      const breakpoints = {
        defaultHeight: 1080,
      } as unknown as BehaviorDrivenUIConfig['breakpoints'];
      expect(() => validator.validateBreakpointsConfig(breakpoints)).toThrow(
        ConfigValidationError
      );
    });

    it('should validate source values', () => {
      const breakpoints = {
        source: 'invalid-source',
      } as unknown as BehaviorDrivenUIConfig['breakpoints'];
      expect(() => validator.validateBreakpointsConfig(breakpoints)).toThrow(
        ConfigValidationError
      );
    });

    it('should validate defaultHeight when provided', () => {
      const breakpoints = {
        source: 'override',
        defaultHeight: -1,
      } as unknown as BehaviorDrivenUIConfig['breakpoints'];
      expect(() => validator.validateBreakpointsConfig(breakpoints)).toThrow(
        ConfigValidationError
      );
    });

    it('should validate override values', () => {
      const breakpoints = {
        source: 'override',
        override: {
          mobile: -1,
        },
      } as unknown as BehaviorDrivenUIConfig['breakpoints'];
      expect(() => validator.validateBreakpointsConfig(breakpoints)).toThrow(
        ConfigValidationError
      );
    });
  });

  describe('validateMocksConfig', () => {
    it('should allow undefined mocks', () => {
      expect(() => validator.validateMocksConfig(undefined)).not.toThrow();
    });

    it('should allow null mocks', () => {
      expect(() => validator.validateMocksConfig(null)).not.toThrow();
    });

    it('should validate mock objects', () => {
      const mocks = {
        api: { enabled: true },
        database: { enabled: false },
      };
      expect(() => validator.validateMocksConfig(mocks)).not.toThrow();
    });

    it('should reject non-object mocks', () => {
      expect(() =>
        validator.validateMocksConfig(
          'invalid' as unknown as BehaviorDrivenUIConfig['mocks']
        )
      ).toThrow(ConfigValidationError);
    });

    it('should validate individual mock configs', () => {
      const mocks = {
        api: null,
      } as unknown as BehaviorDrivenUIConfig['mocks'];
      expect(() => validator.validateMocksConfig(mocks)).toThrow(
        ConfigValidationError
      );
    });

    it('should validate enabled property', () => {
      const mocks = {
        api: { enabled: 'yes' },
      } as unknown as BehaviorDrivenUIConfig['mocks'];
      expect(() => validator.validateMocksConfig(mocks)).toThrow(
        ConfigValidationError
      );
    });
  });

  describe('validateTagConfig', () => {
    it('should validate valid tag config', () => {
      const tagConfig = {
        driver: { kind: 'playwright' as const },
      };
      expect(() =>
        validator.validateTagConfig('testTag', tagConfig)
      ).not.toThrow();
    });

    it('should require tag config object', () => {
      expect(() =>
        validator.validateTagConfig(
          'testTag',
          null as unknown as NonNullable<BehaviorDrivenUIConfig['tags']>[string]
        )
      ).toThrow(ConfigValidationError);
    });

    it('should include tag name in error messages', () => {
      try {
        validator.validateTagConfig(
          'myTag',
          null as unknown as NonNullable<BehaviorDrivenUIConfig['tags']>[string]
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).message).toContain('myTag');
      }
    });
  });

  describe('validateConfig', () => {
    const validConfig: BehaviorDrivenUIConfig = {
      webServer: {
        baseURL: 'http://localhost:3000',
        command: 'npm start',
        port: 3000,
      },
      features: ['**/*.feature'],
      steps: ['**/*.steps.ts'],
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
          desktop: 1024,
        },
      },
      mocks: {
        api: { enabled: true },
      },
      tags: {
        smoke: { enabled: true, description: 'Smoke tests' },
      },
    };

    it('should validate complete valid configuration', () => {
      expect(() => validator.validateConfig(validConfig)).not.toThrow();
    });

    it('should require webServer.baseURL', () => {
      const config = {
        ...validConfig,
        webServer: { ...validConfig.webServer, baseURL: '' },
      };
      expect(() => validator.validateConfig(config)).toThrow(
        ConfigValidationError
      );
    });

    it('should validate all configuration sections', () => {
      // This test ensures all validation methods are called
      const invalidConfig = {
        ...validConfig,
        features: [], // Invalid - empty array
      };
      expect(() => validator.validateConfig(invalidConfig)).toThrow(
        ConfigValidationError
      );
    });

    it('should validate tags when present', () => {
      const configWithInvalidTag = {
        ...validConfig,
        tags: {
          invalidTag: null,
        },
      } as unknown as BehaviorDrivenUIConfig;
      expect(() => validator.validateConfig(configWithInvalidTag)).toThrow(
        ConfigValidationError
      );
    });

    it('should work without tags', () => {
      const configWithoutTags = {
        ...validConfig,
        tags: undefined,
      } as unknown as BehaviorDrivenUIConfig;
      expect(() => validator.validateConfig(configWithoutTags)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw ConfigValidationError instances', () => {
      try {
        validator.validateURL('invalid', 'testField');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect(error).toHaveProperty('field', 'testField');
        expect(error).toHaveProperty('value', 'invalid');
      }
    });

    it('should preserve ConfigValidationError when re-thrown', () => {
      const originalError = new ConfigValidationError(
        'Test error',
        'field',
        'value'
      );

      // Simulate a case where ConfigValidationError is caught and re-thrown
      expect(() => {
        try {
          throw originalError;
        } catch (error) {
          if (error instanceof ConfigValidationError) {
            throw error;
          }
        }
      }).toThrow(ConfigValidationError);
    });
  });
});
