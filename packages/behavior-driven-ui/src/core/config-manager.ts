/* global console */

import type {
  LoadBduiConfigOptions,
  LoadBduiConfigResult,
} from '../cli/config/loader.js';
import { loadBduiConfig } from '../cli/config/loader.js';

import type {
  BehaviorDrivenUIConfig,
  BreakpointsDef,
  MocksDef,
  TagsDef,
} from './types.js';
import { validateConfig } from './config.js';

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export interface ServerInfo {
  url: string;
  port: number;
}

/**
 * ConfigManager - Single source of truth for all configuration
 *
 * Responsibilities:
 * - Load and merge project config with BDUI defaults
 * - Handle runtime updates (e.g., detected server URLs)
 * - Provide validated config to all consumers
 * - Manage config lifecycle
 */
export class ConfigManager {
  private loadedConfig: LoadBduiConfigResult | null = null;
  private runtimeConfig: BehaviorDrivenUIConfig | null = null;

  /**
   * Load and merge configuration from project config file
   */
  async loadConfig(options?: LoadBduiConfigOptions): Promise<void> {
    this.loadedConfig = await loadBduiConfig(options);

    // Build initial runtime config from loaded config
    this.runtimeConfig = this.buildRuntimeConfig(
      this.loadedConfig.resolvedConfig
    );

    // Validate the merged config
    try {
      validateConfig(this.runtimeConfig);
    } catch (error: unknown) {
      const message = isErrorWithMessage(error) ? error.message : String(error);
      throw new Error(`Config validation failed: ${message}`);
    }

    // eslint-disable-next-line no-console
    console.log('[config-manager] Configuration loaded and validated');
  }

  /**
   * Update server information from ServerManager
   */
  updateServerInfo(serverInfo: ServerInfo): void {
    if (!this.runtimeConfig || !this.loadedConfig) {
      throw new Error('Config must be loaded before updating server info');
    }

    const oldBaseURL = this.runtimeConfig.baseURL;
    const oldPort = this.runtimeConfig.webServer?.port;

    // Update runtime config
    this.runtimeConfig.baseURL = serverInfo.url;
    if (this.runtimeConfig.webServer) {
      this.runtimeConfig.webServer.port = serverInfo.port;
    }

    // Update loaded config by creating new object with merged changes
    this.loadedConfig = {
      ...this.loadedConfig,
      resolvedConfig: {
        ...this.loadedConfig.resolvedConfig,
        baseURL: serverInfo.url,
        webServer: this.loadedConfig.resolvedConfig.webServer
          ? {
              ...this.loadedConfig.resolvedConfig.webServer,
              port: serverInfo.port,
            }
          : undefined,
      },
    };

    // eslint-disable-next-line no-console
    console.log(
      `[config-manager] Updated baseURL: ${oldBaseURL} → ${serverInfo.url}, port: ${oldPort} → ${serverInfo.port}`
    );
  }

  /**
   * Get the current runtime configuration
   */
  getConfig(): BehaviorDrivenUIConfig {
    if (!this.runtimeConfig) {
      throw new Error('Config has not been loaded. Call loadConfig() first.');
    }

    return { ...this.runtimeConfig }; // Return copy to prevent external mutation
  }

  /**
   * Get the loaded config result (includes project root, etc.)
   */
  getLoadedConfigResult(): LoadBduiConfigResult {
    if (!this.loadedConfig) {
      throw new Error('Config has not been loaded. Call loadConfig() first.');
    }

    return this.loadedConfig;
  }

  /**
   * Check if config has been loaded
   */
  isLoaded(): boolean {
    return this.loadedConfig !== null && this.runtimeConfig !== null;
  }

  /**
   * Build runtime config from resolved config
   */
  private buildRuntimeConfig(
    resolvedConfig: LoadBduiConfigResult['resolvedConfig']
  ): BehaviorDrivenUIConfig {
    const config: BehaviorDrivenUIConfig = {
      baseURL: resolvedConfig.baseURL,
      features: [...resolvedConfig.features],
      steps: [...resolvedConfig.steps],
      driver: {
        kind: resolvedConfig.driver.kind,
        browser: resolvedConfig.driver.browser,
        headless: resolvedConfig.driver.headless,
      },
    };

    // Optional properties
    if (resolvedConfig.webServer) {
      const { reuseExistingServer, ...rest } = resolvedConfig.webServer;
      config.webServer = {
        ...rest,
        ...(reuseExistingServer !== undefined ? { reuseExistingServer } : {}),
      };
    }

    // Optional properties - check if they exist on resolvedConfig
    if (
      'breakpoints' in resolvedConfig &&
      resolvedConfig.breakpoints !== undefined
    ) {
      const breakpoints = resolvedConfig.breakpoints;
      config.breakpoints = JSON.parse(
        JSON.stringify(breakpoints)
      ) as BreakpointsDef;
    }

    if ('mocks' in resolvedConfig && resolvedConfig.mocks !== undefined) {
      const mocks = resolvedConfig.mocks;
      config.mocks = JSON.parse(JSON.stringify(mocks)) as MocksDef;
    }

    if ('tags' in resolvedConfig && resolvedConfig.tags !== undefined) {
      const tags = resolvedConfig.tags;
      config.tags = JSON.parse(JSON.stringify(tags)) as TagsDef;
    }

    return config;
  }
}

/**
 * Global config manager instance
 * This ensures a single source of truth across the entire application
 */
export const globalConfigManager = new ConfigManager();
