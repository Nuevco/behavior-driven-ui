import { BaseDriver } from '../core/driver.js';

export interface MockNavigationEntry {
  readonly url: string;
  readonly timestamp: number;
}

/**
 * Lightweight in-memory driver used to validate step definitions without a real browser.
 */
export class MockDriver extends BaseDriver {
  private currentUrl: string | null = null;

  private readonly navigationHistory: MockNavigationEntry[] = [];

  private viewport: { width: number; height: number } = {
    width: 1280,
    height: 720,
  };

  /** Clears navigation history to prepare for a new scenario. */
  resetHistory(): void {
    this.navigationHistory.length = 0;
  }

  /**
   * Returns a copy of the recorded navigation history.
   */
  get visitedUrls(): readonly MockNavigationEntry[] {
    return [...this.navigationHistory];
  }

  override async goto(url: string): Promise<void> {
    this.checkNotDestroyed();
    this.currentUrl = url;
    this.navigationHistory.push({
      url,
      timestamp: Date.now(),
    });
  }

  override async reload(): Promise<void> {
    this.checkNotDestroyed();
    if (this.currentUrl === null) {
      throw new Error('MockDriver: cannot reload without an active URL');
    }

    this.navigationHistory.push({
      url: this.currentUrl,
      timestamp: Date.now(),
    });
  }

  override async back(): Promise<void> {
    this.checkNotDestroyed();
  }

  override async forward(): Promise<void> {
    this.checkNotDestroyed();
  }

  override async click(_selector: string): Promise<void> {
    this.checkNotDestroyed();
  }

  override async type(_selector: string, _text: string): Promise<void> {
    this.checkNotDestroyed();
  }

  override async fill(_selector: string, _value: string): Promise<void> {
    this.checkNotDestroyed();
  }

  override async select(
    _selector: string,
    _options: string | string[]
  ): Promise<void> {
    this.checkNotDestroyed();
  }

  override async waitFor(
    _selector: string,
    _options?: { timeout?: number }
  ): Promise<void> {
    this.checkNotDestroyed();
  }

  override async expect(_selector: string, _condition: string): Promise<void> {
    this.checkNotDestroyed();
  }

  override async getText(_selector: string): Promise<string> {
    this.checkNotDestroyed();
    return '';
  }

  override async getValue(_selector: string): Promise<string> {
    this.checkNotDestroyed();
    return '';
  }

  override async screenshot(_options?: {
    path?: string;
    fullPage?: boolean;
  }): Promise<Uint8Array> {
    this.checkNotDestroyed();
    return new Uint8Array();
  }

  override async fullPageScreenshot(_path: string): Promise<void> {
    this.checkNotDestroyed();
  }

  override async setViewport(width: number, height: number): Promise<void> {
    this.checkNotDestroyed();
    this.viewport = { width, height };
  }

  override async getViewport(): Promise<{ width: number; height: number }> {
    this.checkNotDestroyed();
    return { ...this.viewport };
  }

  override async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    await super.destroy();
  }
}
