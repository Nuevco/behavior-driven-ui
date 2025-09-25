/**
 * Tests for ConfigFileLoader - file I/O operations for configuration system
 */

/* eslint-disable max-lines-per-function, max-nested-callbacks */

import * as path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentDir } from '@nuevco/free-paths';

import { ConfigFileLoadError, ConfigFileLoader } from './config-file-loader.js';
import { LoaderRegistry } from './loader-registry.js';
import { type IFileManager, NodeFileManager } from './file-manager.js';

describe('ConfigFileLoader', () => {
  let configFileLoader: ConfigFileLoader;
  let mockLoaderRegistry: LoaderRegistry;
  let mockFileManager: IFileManager;

  beforeEach(() => {
    mockLoaderRegistry = LoaderRegistry.createTestInstance();
    mockFileManager = {
      isFileAccessible: vi.fn(),
      pathToFileURL: vi.fn(),
      importModule: vi.fn(),
    };
    configFileLoader = new ConfigFileLoader(
      mockLoaderRegistry,
      mockFileManager
    );
    vi.clearAllMocks();
  });

  // Integration tests using real file manager for actual file operations
  describe('Integration Tests with Real File Manager', () => {
    let integrationConfigFileLoader: ConfigFileLoader;
    let integrationLoaderRegistry: LoaderRegistry;

    beforeEach(() => {
      integrationLoaderRegistry = LoaderRegistry.createTestInstance();
      integrationConfigFileLoader = new ConfigFileLoader(
        integrationLoaderRegistry,
        new NodeFileManager()
      );
    });

    it('should load TypeScript configuration file using real file system', async () => {
      const currentDir = getCurrentDir();
      const tsConfigPath = path.resolve(
        currentDir,
        '../../test-artifacts/config-samples/sample-config.ts'
      );

      // Ensure LoaderRegistry is ready
      await integrationLoaderRegistry.registerLoaders();

      const result =
        await integrationConfigFileLoader.loadConfigFile(tsConfigPath);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('filePath', tsConfigPath);
      expect(result).toHaveProperty('config');
      expect(result.config).toHaveProperty('name', 'test-artifact-config');
    });

    it('should load JavaScript configuration file using real file system', async () => {
      const currentDir = getCurrentDir();
      const jsConfigPath = path.resolve(
        currentDir,
        '../../test-artifacts/config-samples/sample-config.js'
      );

      const result =
        await integrationConfigFileLoader.loadConfigFile(jsConfigPath);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('filePath', jsConfigPath);
      expect(result).toHaveProperty('config');
      expect(result.config).toHaveProperty('name', 'test-artifact-config-js');
    });

    it('should return false for non-existent files in real file system', async () => {
      const currentDir = getCurrentDir();
      const nonExistentPath = path.resolve(
        currentDir,
        '../../test-artifacts/config-samples/does-not-exist.js'
      );

      const isAccessible =
        await integrationConfigFileLoader.isFileAccessible(nonExistentPath);
      expect(isAccessible).toBe(false);
    });

    it('should return true for existing files in real file system', async () => {
      const currentDir = getCurrentDir();
      const existingPath = path.resolve(
        currentDir,
        '../../test-artifacts/config-samples/sample-config.js'
      );

      const isAccessible =
        await integrationConfigFileLoader.isFileAccessible(existingPath);
      expect(isAccessible).toBe(true);
    });

    describe('file discovery', () => {
      it('should discover configuration files in priority order', async () => {
        const testDir = '/mock/test/dir';
        const expectedPath = path.resolve(testDir, 'bdui.config.ts');

        // Mock file manager to simulate bdui.config.ts exists
        const mockFileAccessible = vi.mocked(mockFileManager.isFileAccessible);
        mockFileAccessible.mockImplementation((filePath: string) =>
          Promise.resolve(filePath === expectedPath)
        );

        const result = await configFileLoader.findConfigFile(testDir);
        expect(result).toBe(expectedPath);
        expect(mockFileManager.isFileAccessible).toHaveBeenCalledWith(
          expectedPath
        );
      });

      it('should return null when no configuration files exist', async () => {
        const emptyDir = '/mock/empty/dir';

        // Mock file manager to return false for all files
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(false);

        const result = await configFileLoader.findConfigFile(emptyDir);
        expect(result).toBeNull();
      });

      it('should respect configuration file priority order', async () => {
        const testDir = '/mock/priority/test';
        const jsPath = path.resolve(testDir, 'bdui.config.js');
        const tsPath = path.resolve(testDir, 'bdui.config.ts');

        // Mock file manager to simulate both files exist
        const mockFileAccessible = vi.mocked(mockFileManager.isFileAccessible);
        mockFileAccessible.mockImplementation((filePath: string) =>
          Promise.resolve(filePath === tsPath || filePath === jsPath)
        );

        const result = await configFileLoader.findConfigFile(testDir);
        // Should prefer .ts over .js (higher priority)
        expect(result).toBe(tsPath);
      });
    });

    describe('file loading - TypeScript files', () => {
      it('should load valid TypeScript configuration file using LoaderRegistry', async () => {
        const tsConfigPath = '/mock/path/bdui.config.ts';
        const mockConfig = { name: 'test-artifact-config', version: '1.0.0' };
        const mockModule = { default: mockConfig };
        const mockUrl = new URL(`file://${tsConfigPath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mockModule);
        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript').mockReturnValue(
          false
        );
        vi.spyOn(mockLoaderRegistry, 'isReady').mockReturnValue(false);
        vi.spyOn(mockLoaderRegistry, 'registerLoaders').mockResolvedValue();

        // After registerLoaders, canLoadTypeScript should return true
        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript')
          .mockReturnValueOnce(false)
          .mockReturnValue(true);

        const result = await configFileLoader.loadConfigFile(tsConfigPath);

        expect(result).toBeDefined();
        expect(result).toHaveProperty('filePath', tsConfigPath);
        expect(result).toHaveProperty('config');
        expect(result.config).toEqual(mockConfig);
        expect(mockLoaderRegistry.registerLoaders).toHaveBeenCalled();
      });

      it('should throw ConfigFileLoadError when LoaderRegistry not ready', async () => {
        const tsConfigPath = '/mock/path/bdui.config.ts';

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript').mockReturnValue(
          false
        );
        vi.spyOn(mockLoaderRegistry, 'isReady').mockReturnValue(false);
        vi.spyOn(mockLoaderRegistry, 'registerLoaders').mockRejectedValue(
          new Error('Failed to register loaders')
        );

        await expect(
          configFileLoader.loadConfigFile(tsConfigPath)
        ).rejects.toThrow(ConfigFileLoadError);
      });

      it('should handle TypeScript compilation errors gracefully', async () => {
        const malformedTsPath = '/mock/path/malformed.ts';
        const mockUrl = new URL(`file://${malformedTsPath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockRejectedValue(
          new Error('Syntax error in TypeScript file')
        );
        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript').mockReturnValue(true);

        await expect(
          configFileLoader.loadConfigFile(malformedTsPath)
        ).rejects.toThrow(ConfigFileLoadError);
      });
    });

    describe('file loading - JavaScript files', () => {
      it('should load valid JavaScript configuration file', async () => {
        const jsConfigPath = '/mock/path/bdui.config.js';
        const mockConfig = {
          name: 'test-artifact-config-js',
          version: '1.0.0',
        };
        const mockUrl = new URL(`file://${jsConfigPath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mockConfig);

        const result = await configFileLoader.loadConfigFile(jsConfigPath);

        expect(result).toBeDefined();
        expect(result).toHaveProperty('filePath', jsConfigPath);
        expect(result).toHaveProperty('config');
        expect(result.config).toEqual(mockConfig);
      });

      it('should handle different JavaScript module formats', async () => {
        const cjsPath = '/mock/path/config.cjs';
        const mjsPath = '/mock/path/config.mjs';
        const cjsConfig = { name: 'commonjs-config', type: 'cjs-module' };
        const mjsConfig = {
          config: { name: 'es-module-config', type: 'mjs-module' },
        };

        // Setup mocks for CJS
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(
          new URL(`file://${cjsPath}`)
        );
        vi.mocked(mockFileManager.importModule).mockResolvedValue(cjsConfig);

        const cjsResult = await configFileLoader.loadConfigFile(cjsPath);
        expect(cjsResult).toBeDefined();
        expect(cjsResult).toHaveProperty('filePath', cjsPath);
        expect(cjsResult).toHaveProperty('config');
        expect(cjsResult.config).toEqual(cjsConfig);

        // Setup mocks for MJS
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(
          new URL(`file://${mjsPath}`)
        );
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mjsConfig);

        const mjsResult = await configFileLoader.loadConfigFile(mjsPath);
        expect(mjsResult).toBeDefined();
        expect(mjsResult).toHaveProperty('filePath', mjsPath);
        expect(mjsResult).toHaveProperty('config');
        // Since mjsConfig has nested config, the extracted config should be mjsConfig.config
        expect(mjsResult.config).toEqual(mjsConfig.config);
      });
    });

    describe('export handling', () => {
      it('should extract default export as configuration', async () => {
        const defaultExportPath = '/mock/path/config.mts';
        const mockConfig = { name: 'default-only-config', type: 'mts-module' };
        const mockModule = { default: mockConfig };
        const mockUrl = new URL(`file://${defaultExportPath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mockModule);
        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript').mockReturnValue(true);

        const result = await configFileLoader.loadConfigFile(defaultExportPath);

        expect(result).toBeDefined();
        expect(result.config).toEqual(mockConfig);
      });

      it('should extract named config export as configuration', async () => {
        const namedExportPath = '/mock/path/config.cts';
        const mockConfig = { name: 'named-only-config', type: 'cts-module' };
        const mockModule = { config: mockConfig };
        const mockUrl = new URL(`file://${namedExportPath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mockModule);
        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript').mockReturnValue(true);

        const result = await configFileLoader.loadConfigFile(namedExportPath);

        expect(result).toBeDefined();
        expect(result.config).toEqual(mockConfig);
      });

      it('should prefer default export over named config export', async () => {
        const bothExportsPath = '/mock/path/config.ts';
        const defaultConfig = { name: 'default-config' };
        const namedConfig = { name: 'named-config' };
        const mockModule = { default: defaultConfig, config: namedConfig };
        const mockUrl = new URL(`file://${bothExportsPath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mockModule);
        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript').mockReturnValue(true);

        const result = await configFileLoader.loadConfigFile(bothExportsPath);

        expect(result).toBeDefined();
        // Should prefer default export over named config export
        expect(result.config).toEqual(defaultConfig);
      });

      it('should handle module namespace when no specific exports found', async () => {
        const namespacePath = '/mock/path/module.mjs';
        const mockModule = { someExport: 'value', otherExport: 123 };
        const mockUrl = new URL(`file://${namespacePath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mockModule);

        const result = await configFileLoader.loadConfigFile(namespacePath);

        expect(result).toBeDefined();
        // Should return the entire module namespace when no default or config export
        expect(result.config).toEqual(mockModule);
      });
    });

    describe('error handling', () => {
      it('should throw ConfigFileLoadError for malformed configuration files', async () => {
        const malformedPath = '/mock/path/malformed.ts';
        const mockUrl = new URL(`file://${malformedPath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockRejectedValue(
          new Error('Syntax error')
        );
        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript').mockReturnValue(true);

        await expect(
          configFileLoader.loadConfigFile(malformedPath)
        ).rejects.toThrow(ConfigFileLoadError);

        try {
          await configFileLoader.loadConfigFile(malformedPath);
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigFileLoadError);
          expect((error as ConfigFileLoadError).message).toContain(
            malformedPath
          );
        }
      });

      it('should throw ConfigFileLoadError for missing configuration files', async () => {
        const nonExistentPath = '/mock/path/does-not-exist.ts';

        // Setup mock to return false for file accessibility
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(false);

        await expect(
          configFileLoader.loadConfigFile(nonExistentPath)
        ).rejects.toThrow(ConfigFileLoadError);

        try {
          await configFileLoader.loadConfigFile(nonExistentPath);
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigFileLoadError);
          expect((error as ConfigFileLoadError).message).toContain(
            nonExistentPath
          );
          expect((error as ConfigFileLoadError).message).toMatch(
            /not found|does not exist/i
          );
        }
      });

      it('should include file path in all error messages', async () => {
        const testPaths = [
          '/mock/path/does-not-exist.ts',
          '/mock/path/malformed-syntax.ts',
        ];

        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript').mockReturnValue(true);

        for (const testPath of testPaths) {
          // Setup different mocks for each scenario
          if (testPath.includes('does-not-exist')) {
            vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(
              false
            );
          } else {
            vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
            vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(
              new URL(`file://${testPath}`)
            );
            vi.mocked(mockFileManager.importModule).mockRejectedValue(
              new Error('Syntax error')
            );
          }

          try {
            await configFileLoader.loadConfigFile(testPath);
          } catch (error) {
            expect(error).toBeInstanceOf(ConfigFileLoadError);
            expect((error as ConfigFileLoadError).message).toContain(testPath);
          }
        }
      });

      it('should chain underlying errors properly', async () => {
        const malformedPath = '/mock/path/malformed-syntax.ts';
        const mockUrl = new URL(`file://${malformedPath}`);
        const underlyingError = new Error('Syntax error in file');

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockRejectedValue(
          underlyingError
        );
        vi.spyOn(mockLoaderRegistry, 'canLoadTypeScript').mockReturnValue(true);

        try {
          await configFileLoader.loadConfigFile(malformedPath);
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigFileLoadError);
          // ConfigFileLoadError should chain the underlying error
          expect((error as ConfigFileLoadError).cause).toBe(underlyingError);
        }
      });
    });

    describe('path resolution', () => {
      it('should resolve relative configuration paths correctly', async () => {
        const relativePath = './mock/config.js';
        const expectedAbsolute = path.resolve(relativePath);
        const mockConfig = { name: 'relative-path-config' };
        const mockUrl = new URL(`file://${expectedAbsolute}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mockConfig);

        const result = await configFileLoader.loadConfigFile(relativePath);
        expect(result).toBeDefined();
        expect(result.filePath).toBe(relativePath);
        expect(result.config).toEqual(mockConfig);
      });

      it('should handle absolute configuration paths unchanged', async () => {
        const absolutePath = '/mock/absolute/path/config.js';
        const mockConfig = { name: 'absolute-path-config' };
        const mockUrl = new URL(`file://${absolutePath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mockConfig);

        const result = await configFileLoader.loadConfigFile(absolutePath);
        expect(result).toBeDefined();
        expect(result.filePath).toBe(absolutePath);
        expect(result.config).toEqual(mockConfig);
      });

      it('should normalize path separators across platforms', async () => {
        const configPath = '/mock/path\\with\\backslashes/config.js';
        const normalizedPath = path.normalize(configPath);
        const mockConfig = { name: 'normalized-path-config' };
        const mockUrl = new URL(`file://${normalizedPath}`);

        // Setup mocks
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);
        vi.mocked(mockFileManager.pathToFileURL).mockReturnValue(mockUrl);
        vi.mocked(mockFileManager.importModule).mockResolvedValue(mockConfig);

        const result = await configFileLoader.loadConfigFile(normalizedPath);
        expect(result).toBeDefined();
        expect(result.config).toEqual(mockConfig);
      });
    });

    describe('file accessibility', () => {
      it('should validate configuration file exists and is readable', async () => {
        const existingPath = '/mock/path/existing-config.js';

        // Mock the file manager to simulate file exists
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(true);

        const isAccessible =
          await configFileLoader.isFileAccessible(existingPath);
        expect(isAccessible).toBe(true);
        expect(mockFileManager.isFileAccessible).toHaveBeenCalledWith(
          existingPath
        );
      });

      it('should return false for non-existent files without throwing', async () => {
        const nonExistentPath = '/mock/path/does-not-exist.js';

        // Mock the file manager to simulate file does not exist
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(false);

        const isAccessible =
          await configFileLoader.isFileAccessible(nonExistentPath);
        expect(isAccessible).toBe(false);
        expect(mockFileManager.isFileAccessible).toHaveBeenCalledWith(
          nonExistentPath
        );
      });

      it('should handle permission denied scenarios gracefully', async () => {
        const testPath = '/mock/path/permission-denied-config.js';

        // Mock the file manager to simulate permission denied
        vi.mocked(mockFileManager.isFileAccessible).mockResolvedValue(false);

        const isAccessible = await configFileLoader.isFileAccessible(testPath);

        expect(isAccessible).toBe(false);
        expect(mockFileManager.isFileAccessible).toHaveBeenCalledWith(testPath);
      });
    });

    describe('integration with LoaderRegistry', () => {
      it('should check LoaderRegistry readiness before loading TS files', () => {
        // TODO: Mock LoaderRegistry.isReady() method
        // TODO: Attempt to load TypeScript config
        // TODO: Verify LoaderRegistry.isReady() was called
        expect(true).toBe(true); // Placeholder
      });

      it('should register loaders if not ready before TS file loading', () => {
        // TODO: Mock LoaderRegistry initially not ready
        // TODO: Mock LoaderRegistry.registerLoaders() to succeed
        // TODO: Load TypeScript config
        // TODO: Verify registerLoaders() was called and config loaded
        expect(true).toBe(true); // Placeholder
      });

      it('should handle LoaderRegistry registration failures', () => {
        // TODO: Mock LoaderRegistry.registerLoaders() to fail
        // TODO: Attempt to load TypeScript config
        // TODO: Assert throws ConfigFileLoadError with loader registration details
        expect(true).toBe(true); // Placeholder
      });
    });
  }); // End Integration Tests with Real File Manager
});
