/**
 * Base driver interface and utilities
 */

import type { Driver } from './types.js';

/**
 * Abstract base class for driver implementations
 *
 * This class provides common functionality and error handling
 * patterns that all driver implementations should follow.
 */
export abstract class BaseDriver implements Driver {
  /** Whether the driver has been destroyed */
  protected destroyed = false;

  /**
   * Check if the driver has been destroyed
   *
   * @throws Error if the driver has been destroyed
   */
  protected checkNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error('Driver has been destroyed and cannot be used');
    }
  }

  // Abstract methods that must be implemented by concrete drivers
  abstract goto(url: string): Promise<void>;
  abstract reload(): Promise<void>;
  abstract back(): Promise<void>;
  abstract forward(): Promise<void>;
  abstract click(selector: string): Promise<void>;
  abstract type(selector: string, text: string): Promise<void>;
  abstract fill(selector: string, value: string): Promise<void>;
  abstract select(selector: string, options: string | string[]): Promise<void>;
  abstract waitFor(
    selector: string,
    options?: { timeout?: number }
  ): Promise<void>;
  abstract expect(selector: string, condition: string): Promise<void>;
  abstract getText(selector: string): Promise<string>;
  abstract getValue(selector: string): Promise<string>;
  abstract screenshot(options?: {
    path?: string;
    fullPage?: boolean;
  }): Promise<Uint8Array>;
  abstract fullPageScreenshot(path: string): Promise<void>;
  abstract setViewport(width: number, height: number): Promise<void>;
  abstract getViewport(): Promise<{ width: number; height: number }>;

  /**
   * Destroy the driver and cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
  }
}

/**
 * Driver error classes for specific error types
 */

/**
 * Base error class for driver-related errors
 */
export class DriverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriverError';
  }
}

/**
 * Error thrown when an element is not found
 */
export class ElementNotFoundError extends DriverError {
  constructor(selector: string) {
    super(`Element not found: ${selector}`);
    this.name = 'ElementNotFoundError';
  }
}

/**
 * Error thrown when a timeout occurs
 */
export class TimeoutError extends DriverError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Error thrown when navigation fails
 */
export class NavigationError extends DriverError {
  constructor(url: string) {
    super(`Navigation failed: ${url}`);
    this.name = 'NavigationError';
  }
}
