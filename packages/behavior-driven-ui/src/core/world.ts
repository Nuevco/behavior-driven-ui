/**
 * World class for managing test context and state
 */

import type { Driver, WorldConfig } from './types.js';

/**
 * World class manages test context and state across scenarios
 *
 * The World class is instantiated for each scenario and provides:
 * - Access to the configured driver instance
 * - Scenario-specific data storage
 * - Lifecycle management (setup/teardown)
 * - Page object instantiation
 */
export class World {
  /** Configuration object */
  public readonly config: WorldConfig['config'];

  /** Driver instance for browser automation */
  private driverInstance: Driver | null;

  /** Deferred driver factory used when a driver instance is not provided */
  private readonly driverFactory: (() => Promise<Driver>) | null;

  /** Scenario-specific data storage */
  private readonly data = new Map<string, unknown>();

  /**
   * Create a new World instance
   *
   * @param config - World configuration
   */
  constructor(config: WorldConfig) {
    this.config = config.config;

    this.driverInstance = config.driver ?? null;
    this.driverFactory = config.driverFactory ?? null;

    if (!this.driverInstance && !this.driverFactory) {
      throw new Error('Driver instance or factory is required in WorldConfig');
    }
  }

  /**
   * Access the active driver instance. Ensure `ensureDriver` has been
   * called before interacting with the driver to guarantee initialization.
   */
  public get driver(): Driver {
    if (!this.driverInstance) {
      throw new Error(
        'Driver has not been initialized yet. Call ensureDriver() first.'
      );
    }

    return this.driverInstance;
  }

  /** Lazily create the driver when a factory is provided. */
  public async ensureDriver(): Promise<Driver> {
    if (this.driverInstance) {
      return this.driverInstance;
    }

    if (!this.driverFactory) {
      throw new Error('Driver factory unavailable.');
    }

    this.driverInstance = await this.driverFactory();
    return this.driverInstance;
  }

  /**
   * Store scenario-specific data
   *
   * @param key - Data key
   * @param value - Data value
   */
  setData<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  /**
   * Retrieve scenario-specific data
   *
   * @param key - Data key
   * @returns The stored value or undefined
   */
  getData<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  /**
   * Check if data exists for a key
   *
   * @param key - Data key
   * @returns True if data exists
   */
  hasData(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * Clear all scenario data
   */
  clearData(): void {
    this.data.clear();
  }

  /**
   * Before scenario hook - called before each scenario
   */
  async beforeScenario(): Promise<void> {
    // Clear any previous scenario data
    this.clearData();

    await this.ensureDriver();

    // Navigate to base URL if configured
    if (this.config.baseURL) {
      await this.driver.goto(this.config.baseURL);
    }
  }

  /**
   * After scenario hook - called after each scenario
   */
  async afterScenario(): Promise<void> {
    // Clear scenario data
    this.clearData();

    // Note: Driver cleanup is handled separately
    // as the driver may be reused across scenarios
  }

  /**
   * Cleanup resources - called when World is destroyed
   */
  async destroy(): Promise<void> {
    this.clearData();
    if (this.driverInstance) {
      await this.driverInstance.destroy();
      this.driverInstance = null;
    }
  }
}
