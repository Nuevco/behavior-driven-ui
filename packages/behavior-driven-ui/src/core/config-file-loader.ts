/**
 * ConfigFileLoader - Handles file I/O operations for configuration system
 */

import path from 'node:path';

import { type IFileManager, getFileManager } from './file-manager.js';
import { type ILoaderRegistry, getLoaderRegistry } from './loader-registry.js';

export const CONFIG_FILES_IN_PRIORITY = [
  'bdui.config.ts',
  'bdui.config.mts',
  'bdui.config.cts',
  'bdui.config.js',
  'bdui.config.mjs',
  'bdui.config.cjs',
] as const;

export type ConfigFileName = (typeof CONFIG_FILES_IN_PRIORITY)[number];

export interface IConfigFileLoadResult {
  readonly filePath: string;
  readonly config: unknown;
}

export interface IConfigFileLoader {
  /** Find the highest priority configuration file in the given directory */
  findConfigFile(projectRoot: string): Promise<string | null>;

  /** Load and parse a configuration file */
  loadConfigFile(configPath: string): Promise<IConfigFileLoadResult>;

  /** Check if a file exists and is accessible */
  isFileAccessible(filePath: string): Promise<boolean>;

  /** Resolve a configuration file path (relative to absolute) */
  resolveConfigPath(configPath: string, projectRoot: string): string;
}

export class ConfigFileLoadError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    cause?: unknown
  ) {
    super(message, cause ? { cause } : undefined);
    this.name = 'ConfigFileLoadError';
  }
}

/**
 * ConfigFileLoader handles all file I/O operations for configuration loading
 * Responsibilities:
 * - File discovery (priority-based)
 * - File accessibility validation
 * - Dynamic module loading (JS/TS)
 * - Export extraction (default, named, namespace)
 * - LoaderRegistry integration for TypeScript files
 */
export class ConfigFileLoader implements IConfigFileLoader {
  private readonly loaderRegistry: ILoaderRegistry;
  private readonly fileManager: IFileManager;

  constructor(loaderRegistry?: ILoaderRegistry, fileManager?: IFileManager) {
    this.loaderRegistry = loaderRegistry ?? getLoaderRegistry();
    this.fileManager = fileManager ?? getFileManager();
  }

  public async findConfigFile(projectRoot: string): Promise<string | null> {
    for (const filename of CONFIG_FILES_IN_PRIORITY) {
      const fullPath = path.resolve(projectRoot, filename);

      if (await this.fileManager.isFileAccessible(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }

  public async loadConfigFile(
    configPath: string
  ): Promise<IConfigFileLoadResult> {
    // Validate file exists
    if (!(await this.fileManager.isFileAccessible(configPath))) {
      throw new ConfigFileLoadError(
        `Configuration file not found: ${configPath}`,
        configPath
      );
    }

    // Check if TypeScript loader is needed
    if (this.isTypeScriptFile(configPath)) {
      await this.ensureTypeScriptSupport(configPath);
    }

    try {
      // Load the module
      const moduleUrl = this.fileManager.pathToFileURL(configPath).href;
      const importedModule: unknown =
        await this.fileManager.importModule(moduleUrl);

      // Extract configuration from module exports
      const config = this.extractConfigFromModule(importedModule);

      return {
        filePath: configPath,
        config,
      };
    } catch (error) {
      throw new ConfigFileLoadError(
        `Failed to load configuration file: ${configPath}`,
        configPath,
        error
      );
    }
  }

  public async isFileAccessible(filePath: string): Promise<boolean> {
    return this.fileManager.isFileAccessible(filePath);
  }

  public resolveConfigPath(configPath: string, projectRoot: string): string {
    if (path.isAbsolute(configPath)) {
      return configPath;
    }

    return path.resolve(projectRoot, configPath);
  }

  private isTypeScriptFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    return ['.ts', '.mts', '.cts'].includes(ext);
  }

  private async ensureTypeScriptSupport(configPath: string): Promise<void> {
    if (!this.loaderRegistry.canLoadTypeScript()) {
      if (!this.loaderRegistry.isReady()) {
        try {
          await this.loaderRegistry.registerLoaders();
        } catch (error) {
          throw new ConfigFileLoadError(
            `TypeScript loader registration failed for: ${configPath}`,
            configPath,
            error
          );
        }
      }

      // Double-check after registration attempt
      if (!this.loaderRegistry.canLoadTypeScript()) {
        throw new ConfigFileLoadError(
          `TypeScript loader not available for: ${configPath}`,
          configPath
        );
      }
    }
  }

  private extractConfigFromModule(importedModule: unknown): unknown {
    if (!this.isModuleNamespace(importedModule)) {
      return importedModule;
    }

    // Priority: default export > config export > entire namespace
    if (Object.hasOwn(importedModule, 'default')) {
      const candidate = importedModule.default;
      if (candidate !== undefined) {
        return candidate;
      }
    }

    if (Object.hasOwn(importedModule, 'config')) {
      const candidate = importedModule.config;
      if (candidate !== undefined) {
        return candidate;
      }
    }

    // Fallback to entire namespace
    return importedModule;
  }

  private isModuleNamespace(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
