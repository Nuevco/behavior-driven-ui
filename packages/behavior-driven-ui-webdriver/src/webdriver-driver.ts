/**
 * WebDriver implementation of the Driver interface
 */

import {
  Builder,
  By,
  Capabilities,
  WebDriver,
  until,
} from 'selenium-webdriver';
import type { Driver } from 'behavior-driven-ui';

import type { WebDriverConfig, WebDriverInstance } from './types.js';

/**
 * WebDriver implementation of the behavior-driven-ui Driver interface
 */
export class WebDriverDriver implements Driver {
  private driver: WebDriver | null = null;
  private config: WebDriverConfig;
  private destroyed = false;

  constructor(config: WebDriverConfig = {}) {
    this.config = {
      browser: 'chrome',
      headless: true,
      implicitWait: 10000,
      pageLoadTimeout: 30000,
      scriptTimeout: 30000,
      ...config,
    };
  }

  /**
   * Initialize the WebDriver instance
   */
  private async initialize(): Promise<void> {
    if (this.driver) {
      return;
    }

    const capabilities = this.config.capabilities ?? new Capabilities();
    const builder = new Builder().withCapabilities(capabilities);

    if (this.config.serverUrl) {
      builder.usingServer(this.config.serverUrl);
    }

    this.driver = await builder.build();

    // Set timeouts - simplified without unsafe access
    if (this.driver) {
      // Basic timeout setup - would need proper typing for selenium-webdriver
      // This is a stub implementation for the skeleton package
    }
  }

  /**
   * Get the WebDriver instance
   */
  async getWebDriverInstance(): Promise<WebDriverInstance> {
    await this.initialize();
    if (!this.driver) {
      throw new Error('Failed to initialize WebDriver');
    }
    return {
      driver: this.driver,
      config: this.config,
    };
  }

  // Driver interface implementation
  async goto(url: string): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    await this.driver.get(url);
  }

  async reload(): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    await this.driver.navigate().refresh();
  }

  async back(): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    await this.driver.navigate().back();
  }

  async forward(): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    await this.driver.navigate().forward();
  }

  async click(selector: string): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    const element = await this.driver.findElement(By.css(selector));
    await element.click();
  }

  async type(selector: string, text: string): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    const element = await this.driver.findElement(By.css(selector));
    await element.sendKeys(text);
  }

  async fill(selector: string, value: string): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    const element = await this.driver.findElement(By.css(selector));
    await element.clear();
    await element.sendKeys(value);
  }

  async select(_selector: string, _options: string | string[]): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    // Basic implementation - would need selenium-webdriver Select class
    throw new Error('Select method not yet implemented for WebDriver');
  }

  async waitFor(
    selector: string,
    options?: { timeout?: number }
  ): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    const timeout = options?.timeout ?? 10000;
    await this.driver.wait(until.elementLocated(By.css(selector)), timeout);
  }

  async expect(_selector: string, _condition: string): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    // Basic implementation - would need proper expectation handling
    throw new Error('Expect method not yet implemented for WebDriver');
  }

  async getText(selector: string): Promise<string> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    const element = await this.driver.findElement(By.css(selector));
    return await element.getText();
  }

  async getValue(selector: string): Promise<string> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    const element = await this.driver.findElement(By.css(selector));
    return await element.getAttribute('value');
  }

  async screenshot(_options?: {
    path?: string;
    fullPage?: boolean;
  }): Promise<Uint8Array> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    // Simplified stub implementation for skeleton package
    throw new Error('screenshot method not yet implemented for WebDriver');
  }

  async fullPageScreenshot(_path: string): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    // Simplified stub implementation
    throw new Error('fullPageScreenshot not yet implemented for WebDriver');
  }

  async setViewport(width: number, height: number): Promise<void> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    await this.driver.manage().window().setRect({ width, height });
  }

  async getViewport(): Promise<{ width: number; height: number }> {
    this.checkNotDestroyed();
    await this.initialize();
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }
    const rect = await this.driver.manage().window().getRect();
    return { width: rect.width, height: rect.height };
  }

  async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  /**
   * Check if the driver has been destroyed
   */
  private checkNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error('WebDriver has been destroyed and cannot be used');
    }
  }
}
