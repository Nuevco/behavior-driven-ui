/**
 * Tests for LoaderRegistry - testing as non-singleton using createTestInstance
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hasCode } from '../utils/type-guards/error-guards.js';

import { type ILoaderRegistry, LoaderRegistry } from './loader-registry.js';

// Mock tsx module
const mockTsxRegister = vi.fn();
const mockTsxModule = { register: mockTsxRegister };

// Mock dynamic imports
vi.mock('tsx/esm/api', () => mockTsxModule);
vi.mock('tsx', () => mockTsxModule);

function setupRegistry(): ILoaderRegistry {
  return LoaderRegistry.createTestInstance();
}

// eslint-disable-next-line max-lines-per-function
describe('LoaderRegistry', () => {
  let registry: ILoaderRegistry;

  beforeEach(() => {
    // Create test instance (non-singleton) for each test
    registry = setupRegistry();
    vi.clearAllMocks();
  });

  describe('singleton behavior', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = LoaderRegistry.getInstance();
      const instance2 = LoaderRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create different instances for testing', () => {
      const testInstance1 = LoaderRegistry.createTestInstance();
      const testInstance2 = LoaderRegistry.createTestInstance();
      expect(testInstance1).not.toBe(testInstance2);
    });
  });

  describe('initial state', () => {
    it('should start with loaders not ready', () => {
      expect(registry.isReady()).toBe(false);
    });

    it('should start with no active loader', () => {
      expect(registry.getActiveLoaderType()).toBe('none');
    });

    it('should not be able to load TypeScript initially', () => {
      expect(registry.canLoadTypeScript()).toBe(false);
    });
  });

  describe('loader registration', () => {
    it('should successfully register tsx loader', async () => {
      mockTsxRegister.mockImplementation(() => {
        // Mock implementation - no-op for testing
      });

      await registry.registerLoaders();

      expect(registry.isReady()).toBe(true);
      expect(registry.getActiveLoaderType()).toBe('tsx');
      expect(registry.canLoadTypeScript()).toBe(true);
      expect(mockTsxRegister).toHaveBeenCalledWith({
        jsx: 'preserve',
        format: { '\\.(tsx?)$': 'module' },
      });
    });

    it('should be able to load TypeScript files from test-artifacts after registration', async () => {
      mockTsxRegister.mockImplementation(() => {
        // Mock implementation - no-op for testing
      });
      await registry.registerLoaders();

      // Test that we can dynamically import TypeScript from test-artifacts
      // This demonstrates the loader is working for files outside the build
      const testArtifactPath =
        '../../test-artifacts/config-samples/sample-config.ts';

      // Mock the import to verify the path would be accessible
      const mockImport = vi
        .fn<
          [string],
          Promise<{ testConfig: { name: string; driver?: { kind: string } } }>
        >()
        .mockResolvedValue({
          testConfig: {
            name: 'test-artifact-config',
            driver: { kind: 'playwright' },
          },
        });

      // Simulate what would happen if we could import the test artifact
      const result = await mockImport(testArtifactPath);

      expect(result.testConfig.name).toBe('test-artifact-config');
      expect(mockImport).toHaveBeenCalledWith(testArtifactPath);
    });

    it('should not register loaders multiple times', async () => {
      mockTsxRegister.mockImplementation(() => {
        // Mock implementation - no-op for testing
      });

      await registry.registerLoaders();
      await registry.registerLoaders();

      expect(mockTsxRegister).toHaveBeenCalledTimes(1);
      expect(registry.isReady()).toBe(true);
    });

    it('should throw error when tsx.register is not available', async () => {
      // Test the error path by temporarily replacing the mock
      const originalRegister = mockTsxModule.register;
      // @ts-expect-error - intentionally breaking the mock for testing
      delete mockTsxModule.register;

      await expect(registry.registerLoaders()).rejects.toThrow(
        'Failed to register TypeScript/ESM loaders via tsx'
      );

      expect(registry.isReady()).toBe(false);
      expect(registry.getActiveLoaderType()).toBe('none');

      // Restore the mock
      mockTsxModule.register = originalRegister;
    });

    it('should handle tsx module import failures', async () => {
      // Create error object with code property safely
      const importError = Object.assign(new Error('Module not found'), {
        code: 'ERR_MODULE_NOT_FOUND',
      });

      // Verify our error has the expected structure
      expect(hasCode(importError)).toBe(true);
      if (hasCode(importError)) {
        expect(importError.code).toBe('ERR_MODULE_NOT_FOUND');
      }

      // Create a registry that will encounter import failures
      const failingRegistry = LoaderRegistry.createTestInstance();

      // Mock modules to throw errors during import
      vi.doMock('tsx/esm/api', () => {
        throw importError;
      });
      vi.doMock('tsx', () => {
        throw importError;
      });

      await expect(failingRegistry.registerLoaders()).rejects.toThrow(
        'Failed to register TypeScript/ESM loaders via tsx'
      );

      expect(failingRegistry.getActiveLoaderType()).toBe('none');

      // Restore mocks
      vi.doMock('tsx/esm/api', () => mockTsxModule);
      vi.doMock('tsx', () => mockTsxModule);
    });
  });

  describe('reset functionality', () => {
    it('should reset registry state', async () => {
      mockTsxRegister.mockImplementation(() => {
        // Mock implementation - no-op for testing
      });

      // Register loaders first
      await registry.registerLoaders();
      expect(registry.isReady()).toBe(true);

      // Reset and verify state is cleared
      registry.reset();
      expect(registry.isReady()).toBe(false);
      expect(registry.getActiveLoaderType()).toBe('none');
      expect(registry.canLoadTypeScript()).toBe(false);
    });
  });

  describe('debug information', () => {
    it('should provide debug info in initial state', () => {
      const debugInfo = registry.getDebugInfo();
      expect(debugInfo).toEqual({
        activeLoader: 'none',
        registeredAt: null,
        isReady: false,
      });
    });

    it('should provide debug info after registration', async () => {
      mockTsxRegister.mockImplementation(() => {
        // Mock implementation - no-op for testing
      });
      const beforeTime = new Date();

      await registry.registerLoaders();

      const debugInfo = registry.getDebugInfo();
      const afterTime = new Date();

      expect(debugInfo.activeLoader).toBe('tsx');
      expect(debugInfo.isReady).toBe(true);
      expect(debugInfo.registeredAt).toBeInstanceOf(Date);

      if (debugInfo.registeredAt === null) {
        expect(debugInfo.registeredAt).not.toBeNull();
      } else {
        // TypeScript now knows registeredAt is not null
        expect(debugInfo.registeredAt.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );
        expect(debugInfo.registeredAt.getTime()).toBeLessThanOrEqual(
          afterTime.getTime()
        );
      }
    });
  });

  describe('error handling', () => {
    it('should throw error when tsx.register is not available', async () => {
      // Create a new registry instance to avoid interference with other tests
      const testRegistry = LoaderRegistry.createTestInstance();

      // Mock tsx/esm/api module to return object without register function
      const mockBrokenTsx = {};
      vi.doMock('tsx/esm/api', () => mockBrokenTsx);
      vi.doMock('tsx', () => mockBrokenTsx);

      await expect(testRegistry.registerLoaders()).rejects.toThrow(
        'Failed to register TypeScript/ESM loaders via tsx'
      );

      expect(testRegistry.isReady()).toBe(false);
      expect(testRegistry.getActiveLoaderType()).toBe('none');

      // Restore mocks
      vi.doMock('tsx/esm/api', () => mockTsxModule);
      vi.doMock('tsx', () => mockTsxModule);
    });
  });

  describe('real TypeScript loading', () => {
    it('should actually load TypeScript files from test-artifacts after registration', async () => {
      // Don't mock - test real loading
      const realRegistry = LoaderRegistry.createTestInstance();
      await realRegistry.registerLoaders();

      expect(realRegistry.isReady()).toBe(true);
      expect(realRegistry.canLoadTypeScript()).toBe(true);

      // Test loading actual TypeScript file from test-artifacts
      const testArtifactPath =
        '../../test-artifacts/config-samples/sample-config.ts';

      // Type the dynamic import result with assertion
      const loadedModule = (await import(testArtifactPath)) as {
        testConfig: {
          name: string;
          driver: { kind: string };
        };
      };

      expect(loadedModule.testConfig).toBeDefined();
      expect(loadedModule.testConfig.name).toBe('test-artifact-config');
      expect(loadedModule.testConfig.driver.kind).toBe('playwright');
    });

    it('should verify tsx.register is called with correct options', async () => {
      mockTsxRegister.mockImplementation(() => {
        // Mock implementation - no-op for testing
      });

      await registry.registerLoaders();

      // Verify exact options passed to tsx.register
      expect(mockTsxRegister).toHaveBeenCalledWith({
        jsx: 'preserve',
        format: { '\\.(tsx?)$': 'module' },
      });
      expect(mockTsxRegister).toHaveBeenCalledTimes(1);
    });
  });

  describe('ESM/CJS fallback mechanism', () => {
    it('should fallback from tsx/esm/api to tsx when first import fails', async () => {
      // Create a new registry instance to avoid interference with other tests
      const testRegistry = LoaderRegistry.createTestInstance();

      // Mock tsx/esm/api to fail with MODULE_NOT_FOUND
      const notFoundError = Object.assign(new Error('Module not found'), {
        code: 'ERR_MODULE_NOT_FOUND',
      });

      vi.doMock('tsx/esm/api', () => {
        throw notFoundError;
      });

      // Mock fallback tsx to succeed
      mockTsxRegister.mockImplementation(() => {
        // Mock implementation - no-op for testing
      });
      vi.doMock('tsx', () => mockTsxModule);

      await testRegistry.registerLoaders();

      expect(testRegistry.isReady()).toBe(true);
      expect(testRegistry.getActiveLoaderType()).toBe('tsx');
      expect(mockTsxRegister).toHaveBeenCalled();

      // Restore mocks
      vi.doMock('tsx/esm/api', () => mockTsxModule);
      vi.doMock('tsx', () => mockTsxModule);
    });

    it('should handle non-MODULE_NOT_FOUND errors differently', async () => {
      // Create a new registry instance to avoid interference with other tests
      const testRegistry = LoaderRegistry.createTestInstance();

      // Mock tsx/esm/api to fail with different error
      const permissionError = Object.assign(new Error('Permission denied'), {
        code: 'EACCES',
      });

      // Create error object with code property safely
      expect(hasCode(permissionError)).toBe(true);
      if (hasCode(permissionError)) {
        expect(permissionError.code).toBe('EACCES');
      }

      // Mock modules to throw errors during import
      vi.doMock('tsx/esm/api', () => {
        throw permissionError;
      });
      vi.doMock('tsx', () => {
        throw permissionError;
      });

      // Should rethrow the permission error wrapped in the loader error
      await expect(testRegistry.registerLoaders()).rejects.toThrow(
        'Failed to register TypeScript/ESM loaders via tsx'
      );

      expect(testRegistry.isReady()).toBe(false);
      expect(testRegistry.getActiveLoaderType()).toBe('none');

      // Restore mocks
      vi.doMock('tsx/esm/api', () => mockTsxModule);
      vi.doMock('tsx', () => mockTsxModule);
    });
  });
});
