/**
 * WebDriver-specific type definitions
 */

import type { Capabilities, WebDriver } from 'selenium-webdriver';

/**
 * Configuration options for WebDriver
 */
export interface WebDriverConfig {
  /** Browser capabilities */
  capabilities?: Capabilities;
  /** WebDriver server URL */
  serverUrl?: string;
  /** Browser name (chrome, firefox, edge, safari) */
  browser?: 'chrome' | 'firefox' | 'edge' | 'safari';
  /** Whether to run in headless mode */
  headless?: boolean;
  /** Implicit wait timeout in milliseconds */
  implicitWait?: number;
  /** Page load timeout in milliseconds */
  pageLoadTimeout?: number;
  /** Script execution timeout in milliseconds */
  scriptTimeout?: number;
}

/**
 * WebDriver instance wrapper
 */
export interface WebDriverInstance {
  /** Native WebDriver instance */
  driver: WebDriver;
  /** Configuration used to create this instance */
  config: WebDriverConfig;
}
