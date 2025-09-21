import type { Browser, BrowserContext, Page } from '@playwright/test';
import { chromium, firefox, webkit } from '@playwright/test';

import { BaseDriver } from '../../core/driver.js';
import type { BehaviorDrivenUIConfig, Driver } from '../../core/types.js';

export type PlaywrightBrowserKind = NonNullable<
  BehaviorDrivenUIConfig['driver']
>['browser'];

export interface PlaywrightDriverOptions {
  readonly browser?: PlaywrightBrowserKind;
  readonly headless?: boolean;
  readonly defaultViewport?: { width: number; height: number };
}

export interface PlaywrightNavigationEntry {
  readonly url: string;
  readonly timestamp: number;
}

function resolveBrowserType(browser: PlaywrightBrowserKind): typeof chromium {
  switch (browser) {
    case 'firefox':
      return firefox;
    case 'webkit':
      return webkit;
    case 'chromium':
    default:
      return chromium;
  }
}

export class PlaywrightDriver extends BaseDriver implements Driver {
  private constructor(
    private readonly browser: Browser,
    private readonly context: BrowserContext,
    private readonly page: Page,
    private readonly navigationHistory: PlaywrightNavigationEntry[]
  ) {
    super();
  }

  public static async launch(
    options: PlaywrightDriverOptions = {}
  ): Promise<PlaywrightDriver> {
    const browserKind: PlaywrightBrowserKind = options.browser ?? 'chromium';
    const browserType = resolveBrowserType(browserKind);

    const browser = await browserType.launch({
      headless: options.headless ?? true,
    });

    const context = await browser.newContext({
      viewport: options.defaultViewport ?? { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    return new PlaywrightDriver(browser, context, page, []);
  }

  public get currentPage(): Page {
    this.checkNotDestroyed();
    return this.page;
  }

  public get visitedUrls(): readonly PlaywrightNavigationEntry[] {
    return [...this.navigationHistory];
  }

  public resetHistory(): void {
    this.navigationHistory.length = 0;
  }

  private recordNavigation(url: string): void {
    this.navigationHistory.push({
      url,
      timestamp: Date.now(),
    });
  }

  override async goto(url: string): Promise<void> {
    this.checkNotDestroyed();
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    this.recordNavigation(this.page.url());
  }

  override async reload(): Promise<void> {
    this.checkNotDestroyed();
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    this.recordNavigation(this.page.url());
  }

  override async back(): Promise<void> {
    this.checkNotDestroyed();
    await this.page.goBack({ waitUntil: 'domcontentloaded' });
    this.recordNavigation(this.page.url());
  }

  override async forward(): Promise<void> {
    this.checkNotDestroyed();
    await this.page.goForward({ waitUntil: 'domcontentloaded' });
    this.recordNavigation(this.page.url());
  }

  override async click(selector: string): Promise<void> {
    this.checkNotDestroyed();
    await this.page.click(selector);
  }

  override async type(selector: string, text: string): Promise<void> {
    this.checkNotDestroyed();
    await this.page.type(selector, text);
  }

  override async fill(selector: string, value: string): Promise<void> {
    this.checkNotDestroyed();
    await this.page.fill(selector, value);
  }

  override async select(
    selector: string,
    options: string | string[]
  ): Promise<void> {
    this.checkNotDestroyed();
    await this.page.selectOption(selector, options);
  }

  override async waitFor(
    selector: string,
    options?: { timeout?: number }
  ): Promise<void> {
    this.checkNotDestroyed();
    const timeout = options?.timeout;
    if (timeout === undefined) {
      await this.page.waitForSelector(selector);
      return;
    }

    await this.page.waitForSelector(selector, { timeout });
  }

  override async expect(selector: string, condition: string): Promise<void> {
    this.checkNotDestroyed();

    switch (condition) {
      case 'to be visible':
        await this.page.waitForSelector(selector, { state: 'visible' });
        return;
      case 'to be hidden':
        await this.page.waitForSelector(selector, { state: 'hidden' });
        return;
      default:
        throw new Error(`Unsupported expectation condition: ${condition}`);
    }
  }

  override async getText(selector: string): Promise<string> {
    this.checkNotDestroyed();
    const content = await this.page.textContent(selector);
    return content ?? '';
  }

  override async getValue(selector: string): Promise<string> {
    this.checkNotDestroyed();
    try {
      const value = await this.page.inputValue(selector);
      return value ?? '';
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        return '';
      }

      throw error;
    }
  }

  override async screenshot(options?: {
    path?: string | undefined;
    fullPage?: boolean | undefined;
  }): Promise<Uint8Array> {
    this.checkNotDestroyed();
    const screenshotOptions: Parameters<Page['screenshot']>[0] = {};

    if (options?.path !== undefined) {
      screenshotOptions.path = options.path;
    }

    if (options?.fullPage !== undefined) {
      screenshotOptions.fullPage = options.fullPage;
    }

    const buffer = await this.page.screenshot(
      Object.keys(screenshotOptions).length ? screenshotOptions : undefined
    );

    return buffer instanceof Uint8Array ? buffer : Uint8Array.from(buffer);
  }

  override async fullPageScreenshot(path: string): Promise<void> {
    this.checkNotDestroyed();
    await this.page.screenshot({ path, fullPage: true });
  }

  override async setViewport(width: number, height: number): Promise<void> {
    this.checkNotDestroyed();
    await this.page.setViewportSize({ width, height });
  }

  override async getViewport(): Promise<{ width: number; height: number }> {
    this.checkNotDestroyed();
    const size = this.page.viewportSize();
    if (!size) {
      throw new Error('Playwright did not return a viewport size.');
    }

    return { ...size };
  }

  override async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    await this.page.close();
    await this.context.close();
    await this.browser.close();
    await super.destroy();
  }
}
