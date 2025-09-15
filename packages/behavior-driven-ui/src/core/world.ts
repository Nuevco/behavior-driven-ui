/**
 * World class for managing test context and state across scenarios
 *
 * The World class is the central hub for behavior-driven UI tests, providing:
 * - Test context management and state persistence
 * - Driver instance access with proper typing
 * - Scenario lifecycle management (setup/teardown)
 * - Page object instantiation and management
 * - Data sharing between test steps
 */

import type { Driver, WorldConfig } from './types.js';

/**
 * World class manages test context and state across scenarios
 *
 * The World class is instantiated once per scenario and provides a consistent
 * interface for managing test state, driver access, and lifecycle hooks.
 * It serves as the foundation for all step definitions and page objects.
 *
 * @example
 * ```typescript
 * import { World } from 'behavior-driven-ui';
 *
 * // Create a world instance with configuration and driver
 * const world = new World({
 *   config: {
 *     baseURL: 'http://localhost:3000',
 *     features: ['**\/*.feature'],
 *     steps: ['**\/*.steps.ts']
 *   },
 *   driver: playwrightDriver
 * });
 *
 * // Use in step definitions
 * world.setData('username', 'john.doe');
 * await world.driver.goto('/login');
 * ```
 *
 * @example
 * ```typescript
 * // Page object instantiation
 * class LoginPage {
 *   constructor(private world: World) {}
 *
 *   async login(username: string, password: string) {
 *     await this.world.driver.fill('#username', username);
 *     await this.world.driver.fill('#password', password);
 *     await this.world.driver.click('#login-button');
 *   }
 * }
 *
 * const loginPage = world.createPageObject(LoginPage);
 * ```
 */
export class World {
  /** Configuration object containing all framework settings */
  public readonly config: WorldConfig['config'];

  /** Driver instance for browser automation and element interaction */
  public readonly driver: Driver;

  /** Scenario-specific data storage for sharing state between steps */
  private readonly data = new Map<string, unknown>();

  /** Cache for instantiated page objects */
  private readonly pageObjects = new Map<string, unknown>();

  /**
   * Create a new World instance for a test scenario
   *
   * Initializes the world with configuration and driver instance.
   * The world acts as the central context for all test operations.
   *
   * @param config - World configuration containing driver and framework settings
   * @throws {Error} When driver instance is not provided in config
   *
   * @example
   * ```typescript
   * const world = new World({
   *   config: {
   *     baseURL: 'http://localhost:3000',
   *     features: ['tests/**\/*.feature'],
   *     steps: ['tests/**\/*.steps.ts']
   *   },
   *   driver: new PlaywrightDriver({ headless: true })
   * });
   * ```
   */
  constructor(config: WorldConfig) {
    this.config = config.config;

    if (!config.driver) {
      throw new Error('Driver instance is required in WorldConfig');
    }

    this.driver = config.driver;
  }

  /**
   * Store scenario-specific data for sharing between test steps
   *
   * Data stored here persists throughout a single scenario but is
   * automatically cleared between scenarios. Use this to share state
   * between different step definitions.
   *
   * @param key - Unique identifier for the data
   * @param value - Data value to store (any type)
   *
   * @example
   * ```typescript
   * // Store user data in a step
   * world.setData('currentUser', { id: 123, name: 'John Doe' });
   *
   * // Access it in another step
   * const user = world.getData<User>('currentUser');
   * ```
   */
  setData<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  /**
   * Retrieve scenario-specific data by key
   *
   * Returns the stored value or undefined if the key doesn't exist.
   * Use type parameter to get proper TypeScript typing.
   *
   * @param key - Data key to retrieve
   * @returns The stored value with proper typing, or undefined if not found
   *
   * @example
   * ```typescript
   * // Retrieve with type safety
   * const user = world.getData<User>('currentUser');
   * if (user) {
   *   console.log(user.name); // TypeScript knows this is a User
   * }
   *
   * // Handle missing data
   * const optional = world.getData<string>('optional-key') ?? 'default-value';
   * ```
   */
  getData<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  /**
   * Check if data exists for a given key
   *
   * Useful for conditional logic in step definitions.
   *
   * @param key - Data key to check
   * @returns True if data exists for the key, false otherwise
   *
   * @example
   * ```typescript
   * if (world.hasData('authToken')) {
   *   // User is authenticated, proceed with protected action
   *   await world.driver.click('#protected-button');
   * } else {
   *   // Redirect to login
   *   await world.driver.goto('/login');
   * }
   * ```
   */
  hasData(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * Clear all scenario-specific data
   *
   * This is automatically called during scenario lifecycle hooks
   * but can be called manually if needed.
   *
   * @example
   * ```typescript
   * // Clear all data manually
   * world.clearData();
   * ```
   */
  clearData(): void {
    this.data.clear();
  }

  /**
   * Create and cache a page object instance
   *
   * Page objects encapsulate page-specific logic and element selectors.
   * This method creates instances once and caches them for reuse within
   * the same scenario.
   *
   * @param PageObjectClass - Constructor function for the page object
   * @param ...args - Additional arguments to pass to the constructor
   * @returns Instance of the page object
   *
   * @example
   * ```typescript
   * class LoginPage {
   *   constructor(private world: World) {}
   *
   *   async login(username: string, password: string) {
   *     await this.world.driver.fill('#username', username);
   *     await this.world.driver.fill('#password', password);
   *     await this.world.driver.click('#login-button');
   *   }
   * }
   *
   * // Create and cache page object
   * const loginPage = world.createPageObject(LoginPage);
   * await loginPage.login('user@example.com', 'password');
   * ```
   *
   * @example
   * ```typescript
   * // Page object with additional dependencies
   * class ApiPage {
   *   constructor(private world: World, private apiClient: ApiClient) {}
   * }
   *
   * const apiPage = world.createPageObject(ApiPage, apiClient);
   * ```
   */
  createPageObject<T>(
    PageObjectClass: new (world: World, ...args: unknown[]) => T,
    ...args: unknown[]
  ): T {
    const className = PageObjectClass.name;

    if (!this.pageObjects.has(className)) {
      const instance = new PageObjectClass(this, ...args);
      this.pageObjects.set(className, instance);
    }

    return this.pageObjects.get(className) as T;
  }

  /**
   * Clear all cached page objects
   *
   * This is automatically called during scenario cleanup but can be
   * called manually if fresh page objects are needed.
   */
  clearPageObjects(): void {
    this.pageObjects.clear();
  }

  /**
   * Before scenario hook - called before each scenario starts
   *
   * Performs setup tasks including:
   * - Clearing previous scenario data
   * - Clearing cached page objects
   * - Navigating to base URL if configured
   *
   * This method is typically called by the test framework automatically.
   *
   * @throws {Error} If navigation to base URL fails
   *
   * @example
   * ```typescript
   * // Called automatically by test framework
   * await world.beforeScenario();
   * ```
   */
  async beforeScenario(): Promise<void> {
    // Clear any previous scenario data
    this.clearData();
    this.clearPageObjects();

    // Navigate to base URL if configured
    if (this.config.baseURL) {
      try {
        await this.driver.goto(this.config.baseURL);
      } catch (error) {
        throw new Error(
          `Failed to navigate to base URL ${this.config.baseURL}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  /**
   * After scenario hook - called after each scenario completes
   *
   * Performs cleanup tasks including:
   * - Clearing scenario-specific data
   * - Clearing cached page objects
   *
   * Driver cleanup is handled separately as drivers may be reused
   * across multiple scenarios.
   *
   * This method is typically called by the test framework automatically.
   *
   * @example
   * ```typescript
   * // Called automatically by test framework
   * await world.afterScenario();
   * ```
   */
  async afterScenario(): Promise<void> {
    // Clear scenario data and page objects
    this.clearData();
    this.clearPageObjects();

    // Note: Driver cleanup is handled separately
    // as the driver may be reused across scenarios
  }

  /**
   * Cleanup all resources when World instance is destroyed
   *
   * Performs complete cleanup including:
   * - Clearing all scenario data
   * - Clearing all cached page objects
   * - Destroying the driver instance
   *
   * This method should be called when the World is no longer needed,
   * typically at the end of test execution.
   *
   * @throws {Error} If driver destruction fails
   *
   * @example
   * ```typescript
   * try {
   *   await world.destroy();
   * } catch (error) {
   *   console.error('Failed to cleanup world:', error);
   * }
   * ```
   */
  async destroy(): Promise<void> {
    try {
      this.clearData();
      this.clearPageObjects();
      await this.driver.destroy();
    } catch (error) {
      throw new Error(
        `Failed to destroy World: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
