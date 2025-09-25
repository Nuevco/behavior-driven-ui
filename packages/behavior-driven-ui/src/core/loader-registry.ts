/**
 * LoaderRegistry - Singleton class for managing TypeScript/ESM loader registration
 */

import { hasCode } from '../utils/type-guards/error-guards.js';

export type LoaderType = 'tsx' | 'ts-node' | 'esbuild' | 'none';

export interface ILoaderDebugInfo {
  activeLoader: LoaderType;
  registeredAt: Date | null;
  isReady: boolean;
}

export interface ILoaderRegistry {
  /** Check if loaders are ready for TypeScript compilation */
  isReady(): boolean;

  /** Get the type of loader that is currently active */
  getActiveLoaderType(): LoaderType;

  /** Check if TypeScript files can be loaded */
  canLoadTypeScript(): boolean;

  /** Register appropriate loaders for TypeScript/ESM support */
  registerLoaders(): Promise<void>;

  /** Reset registry state (for testing) */
  reset(): void;

  /** Get debug information about the loader state */
  getDebugInfo(): ILoaderDebugInfo;
}

interface TsxModule {
  register?: (options?: Record<string, unknown>) => void;
}

/**
 * Singleton registry for managing TypeScript and ESM loaders
 * Provides centralized control over loader registration state
 */
export class LoaderRegistry implements ILoaderRegistry {
  private static instance: LoaderRegistry | null = null;
  private loadersRegistered = false;
  private activeLoader: LoaderType = 'none';
  private registeredAt: Date | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LoaderRegistry {
    LoaderRegistry.instance ??= new LoaderRegistry();
    return LoaderRegistry.instance;
  }

  /**
   * Create a new instance for testing (bypasses singleton)
   * This allows testing the class as though it wasn't a singleton
   */
  public static createTestInstance(): LoaderRegistry {
    const instance = new LoaderRegistry();
    return instance;
  }

  public isReady(): boolean {
    return this.loadersRegistered;
  }

  public getActiveLoaderType(): LoaderType {
    return this.activeLoader;
  }

  public canLoadTypeScript(): boolean {
    return this.loadersRegistered && this.activeLoader !== 'none';
  }

  public async registerLoaders(): Promise<void> {
    if (this.loadersRegistered) {
      return;
    }

    try {
      // Try tsx first (our preferred loader)
      const tsxModule = await this.loadTsxModule();
      if (typeof tsxModule.register !== 'function') {
        throw new Error('tsx.register was not available');
      }

      tsxModule.register({
        jsx: 'preserve',
        format: { '\\.(tsx?)$': 'module' },
      });

      this.loadersRegistered = true;
      this.activeLoader = 'tsx';
      this.registeredAt = new Date();
    } catch (error) {
      // Could extend to try ts-node or other loaders here
      this.activeLoader = 'none';
      const cause =
        error instanceof Error
          ? error
          : new Error(String(error ?? 'Unknown loader error'));
      throw new Error(
        'Failed to register TypeScript/ESM loaders via tsx. Install "tsx" or configure a loader manually.',
        { cause }
      );
    }
  }

  public reset(): void {
    this.loadersRegistered = false;
    this.activeLoader = 'none';
    this.registeredAt = null;
  }

  /**
   * Get debug information about the loader state
   */
  public getDebugInfo(): ILoaderDebugInfo {
    return {
      activeLoader: this.activeLoader,
      registeredAt: this.registeredAt,
      isReady: this.loadersRegistered,
    };
  }

  private async loadTsxModule(): Promise<TsxModule> {
    try {
      return (await import('tsx/esm/api')) as TsxModule;
    } catch (error) {
      if (hasCode(error) && error.code !== 'ERR_MODULE_NOT_FOUND') {
        const cause =
          error instanceof Error
            ? error
            : new Error(String(error ?? 'Unknown loader error'));
        throw cause;
      }
    }

    return (await import('tsx')) as TsxModule;
  }
}

/**
 * Convenience function to get the singleton instance
 */
export function getLoaderRegistry(): LoaderRegistry {
  return LoaderRegistry.getInstance();
}
