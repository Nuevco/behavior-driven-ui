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
    kind: 'playwright' | 'mock';
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
  /** Factory to lazily create the driver when needed */
  driverFactory?: (() => Promise<Driver>) | null;
}

/**
 * Driver interface for browser automation
 */
export interface Driver {
  // Navigation methods
  goto(url: string): Promise<void>;
  reload(): Promise<void>;
  back(): Promise<void>;
  forward(): Promise<void>;

  // Element interaction methods
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  select(selector: string, options: string | string[]): Promise<void>;

  // Assertion/wait methods
  waitFor(selector: string, options?: { timeout?: number }): Promise<void>;
  expect(selector: string, condition: string): Promise<void>;
  getText(selector: string): Promise<string>;
  getValue(selector: string): Promise<string>;

  // Screenshot methods
  screenshot(options?: {
    path?: string;
    fullPage?: boolean;
  }): Promise<Uint8Array>;
  fullPageScreenshot(path: string): Promise<void>;

  // Viewport methods
  setViewport(width: number, height: number): Promise<void>;
  getViewport(): Promise<{ width: number; height: number }>;

  // Lifecycle methods
  destroy(): Promise<void>;
}
