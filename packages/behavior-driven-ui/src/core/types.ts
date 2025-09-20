/**
 * Core type definitions for behavior-driven-ui
 */

/**
 * Configuration for the behavior-driven-ui framework
 */
export interface BehaviorDrivenUIConfig {
  /** Base URL for the application under test */
  baseURL: string;

  /** Web server configuration for starting the application */
  webServer?: {
    /** Command to start the web server */
    command: string;
    /** Port the web server runs on */
    port: number;
    /** Whether to reuse an existing server instance */
    reuseExistingServer?: boolean;
  };

  /** Driver configuration for browser automation */
  driver?: {
    /** Type of driver to use */
    kind: 'playwright' | 'webdriver' | 'cypress';
    /** Browser to use (for Playwright) */
    browser?: 'chromium' | 'firefox' | 'webkit';
    /** Whether to run in headless mode */
    headless?: boolean;
  };

  /** Feature file patterns */
  features: string[];

  /** Step definition file patterns */
  steps: string[];

  /** Breakpoint configuration for responsive testing */
  breakpoints?: {
    /** Source of breakpoint definitions */
    source: 'mui' | 'tailwind' | 'override';
    /** Path to MUI theme file (if using MUI) */
    muiThemePath?: string;
    /** Path to Tailwind config file (if using Tailwind) */
    tailwindConfigPath?: string;
    /** Custom breakpoint overrides */
    override?: Record<string, number>;
    /** Default viewport height */
    defaultHeight?: number;
  };

  /** Mock configuration */
  mocks?: {
    /** Directory containing fixture files */
    fixturesDir: string;
    /** Mocking strategy */
    strategy: 'playwright' | 'msw';
  };

  /** Tag-based configuration overrides */
  tags?: Record<string, Partial<BehaviorDrivenUIConfig>>;
}

/**
 * World configuration options
 */
export interface WorldConfig {
  /** Configuration object */
  config: BehaviorDrivenUIConfig;
  /** Driver instance */
  driver?: Driver;
}

/**
 * Selector type that can be a CSS selector string or element locator object
 */
export type Selector = string;

/**
 * Options for waiting operations
 */
export interface WaitOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Whether element should be visible (default: true) */
  visible?: boolean;
  /** Whether element should be enabled (default: true) */
  enabled?: boolean;
}

/**
 * Screenshot capture options
 */
export interface ScreenshotOptions {
  /** File path to save screenshot */
  path?: string;
  /** Capture full page instead of viewport */
  fullPage?: boolean;
  /** Image quality for JPEG (0-100) */
  quality?: number;
  /** Image format */
  type?: 'png' | 'jpeg';
}

/**
 * Viewport dimensions
 */
export interface ViewportSize {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Assertion conditions for element validation
 */
export type AssertionCondition =
  | 'visible'
  | 'hidden'
  | 'enabled'
  | 'disabled'
  | 'focused'
  | 'checked'
  | 'unchecked'
  | string; // Allow custom conditions

/**
 * Driver interface for browser automation and element interaction
 *
 * This interface defines the contract that all driver implementations must follow.
 * It provides a unified API for browser automation across different underlying
 * technologies (Playwright, WebDriver, Cypress, etc.).
 *
 * @example
 * ```typescript
 * // Navigation
 * await driver.goto('https://example.com');
 * await driver.reload();
 *
 * // Element interaction
 * await driver.click('#submit-button');
 * await driver.fill('#email', 'user@example.com');
 *
 * // Assertions
 * await driver.waitFor('#result', { timeout: 5000 });
 * const text = await driver.getText('#message');
 * ```
 */
export interface Driver {
  /**
   * Navigate to a URL
   *
   * @param url - Target URL (absolute or relative to base URL)
   * @throws {NavigationError} When navigation fails
   *
   * @example
   * ```typescript
   * await driver.goto('https://example.com');
   * await driver.goto('/login'); // Relative to base URL
   * ```
   */
  goto(url: string): Promise<void>;

  /**
   * Reload the current page
   *
   * @throws {NavigationError} When reload fails
   *
   * @example
   * ```typescript
   * await driver.reload();
   * ```
   */
  reload(): Promise<void>;

  /**
   * Navigate back in browser history
   *
   * @throws {NavigationError} When navigation fails
   *
   * @example
   * ```typescript
   * await driver.back();
   * ```
   */
  back(): Promise<void>;

  /**
   * Navigate forward in browser history
   *
   * @throws {NavigationError} When navigation fails
   *
   * @example
   * ```typescript
   * await driver.forward();
   * ```
   */
  forward(): Promise<void>;

  /**
   * Click an element
   *
   * @param selector - CSS selector or element locator
   * @throws {ElementNotFoundError} When element is not found
   * @throws {TimeoutError} When element is not clickable within timeout
   *
   * @example
   * ```typescript
   * await driver.click('#submit-button');
   * await driver.click('[data-testid="login-btn"]');
   * ```
   */
  click(selector: Selector): Promise<void>;

  /**
   * Type text into an element (appends to existing content)
   *
   * @param selector - CSS selector for input element
   * @param text - Text to type
   * @throws {ElementNotFoundError} When element is not found
   * @throws {TimeoutError} When element is not available for typing
   *
   * @example
   * ```typescript
   * await driver.type('#search-input', 'query text');
   * await driver.type('[name="comment"]', 'Additional notes');
   * ```
   */
  type(selector: Selector, text: string): Promise<void>;

  /**
   * Fill an element with text (replaces existing content)
   *
   * @param selector - CSS selector for input element
   * @param value - Value to fill
   * @throws {ElementNotFoundError} When element is not found
   * @throws {TimeoutError} When element is not available for filling
   *
   * @example
   * ```typescript
   * await driver.fill('#email', 'user@example.com');
   * await driver.fill('#password', 'secretpassword');
   * ```
   */
  fill(selector: Selector, value: string): Promise<void>;

  /**
   * Select option(s) from a select element
   *
   * @param selector - CSS selector for select element
   * @param options - Option value(s) to select
   * @throws {ElementNotFoundError} When element is not found
   * @throws {TimeoutError} When element is not available for selection
   *
   * @example
   * ```typescript
   * // Single selection
   * await driver.select('#country', 'usa');
   *
   * // Multiple selection
   * await driver.select('#languages', ['english', 'spanish']);
   * ```
   */
  select(selector: Selector, options: string | string[]): Promise<void>;

  /**
   * Wait for an element to appear and meet conditions
   *
   * @param selector - CSS selector for element to wait for
   * @param options - Wait configuration options
   * @throws {ElementNotFoundError} When element is not found within timeout
   * @throws {TimeoutError} When conditions are not met within timeout
   *
   * @example
   * ```typescript
   * // Wait for element to be visible
   * await driver.waitFor('#loading-spinner', { timeout: 10000 });
   *
   * // Wait for element to be enabled
   * await driver.waitFor('#submit-btn', { enabled: true });
   * ```
   */
  waitFor(selector: Selector, options?: WaitOptions): Promise<void>;

  /**
   * Assert that an element meets a specific condition
   *
   * @param selector - CSS selector for element to check
   * @param condition - Condition to assert (visible, hidden, enabled, etc.)
   * @throws {ElementNotFoundError} When element is not found
   * @throws {AssertionError} When condition is not met
   *
   * @example
   * ```typescript
   * await driver.expect('#success-message', 'visible');
   * await driver.expect('#submit-button', 'enabled');
   * await driver.expect('#loading-indicator', 'hidden');
   * ```
   */
  expect(selector: Selector, condition: AssertionCondition): Promise<void>;

  /**
   * Get text content of an element
   *
   * @param selector - CSS selector for element
   * @returns Text content of the element
   * @throws {ElementNotFoundError} When element is not found
   *
   * @example
   * ```typescript
   * const message = await driver.getText('#status-message');
   * const title = await driver.getText('h1');
   * ```
   */
  getText(selector: Selector): Promise<string>;

  /**
   * Get value of an input element
   *
   * @param selector - CSS selector for input element
   * @returns Current value of the input
   * @throws {ElementNotFoundError} When element is not found
   *
   * @example
   * ```typescript
   * const email = await driver.getValue('#email-input');
   * const selectedOption = await driver.getValue('#country-select');
   * ```
   */
  getValue(selector: Selector): Promise<string>;

  /**
   * Take a screenshot of the current page or viewport
   *
   * @param options - Screenshot configuration options
   * @returns Screenshot data as Uint8Array
   * @throws {DriverError} When screenshot capture fails
   *
   * @example
   * ```typescript
   * // Take viewport screenshot
   * const screenshot = await driver.screenshot();
   *
   * // Take full page screenshot and save to file
   * await driver.screenshot({
   *   path: './screenshots/test-result.png',
   *   fullPage: true
   * });
   * ```
   */
  screenshot(options?: ScreenshotOptions): Promise<Uint8Array>;

  /**
   * Take a full-page screenshot and save to file
   *
   * @param path - File path to save the screenshot
   * @throws {DriverError} When screenshot capture or file save fails
   *
   * @example
   * ```typescript
   * await driver.fullPageScreenshot('./screenshots/full-page.png');
   * ```
   */
  fullPageScreenshot(path: string): Promise<void>;

  /**
   * Set the browser viewport size
   *
   * @param width - Viewport width in pixels
   * @param height - Viewport height in pixels
   * @throws {DriverError} When viewport resize fails
   *
   * @example
   * ```typescript
   * // Set mobile viewport
   * await driver.setViewport(375, 812);
   *
   * // Set desktop viewport
   * await driver.setViewport(1920, 1080);
   * ```
   */
  setViewport(width: number, height: number): Promise<void>;

  /**
   * Get current viewport dimensions
   *
   * @returns Current viewport size
   * @throws {DriverError} When viewport information is not available
   *
   * @example
   * ```typescript
   * const viewport = await driver.getViewport();
   * console.log(`Current size: ${viewport.width}x${viewport.height}`);
   * ```
   */
  getViewport(): Promise<ViewportSize>;

  /**
   * Cleanup driver resources and close browser connection
   *
   * This method should be called when the driver is no longer needed.
   * After calling destroy(), the driver instance should not be used.
   *
   * @throws {DriverError} When cleanup fails
   *
   * @example
   * ```typescript
   * try {
   *   await driver.destroy();
   * } catch (error) {
   *   console.error('Driver cleanup failed:', error);
   * }
   * ```
   */
  destroy(): Promise<void>;
}
