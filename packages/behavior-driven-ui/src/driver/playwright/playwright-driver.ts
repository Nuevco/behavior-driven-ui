import type { Browser, BrowserContext, Frame, Page } from '@playwright/test';
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
  private readonly stopTrackingNavigations: () => void;

  private static readonly SUPPORTED_EXPECTATIONS = [
    'to be visible',
    'to be hidden',
    'to have text "<value>"',
    'to contain text "<value>"',
    'to have value "<value>"',
  ];

  private constructor(
    private readonly browser: Browser,
    private readonly context: BrowserContext,
    private readonly page: Page,
    private readonly navigationHistory: PlaywrightNavigationEntry[]
  ) {
    super();
    this.stopTrackingNavigations = this.trackNavigations();
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
    if (!url || url === 'about:blank') {
      return;
    }

    const previous = this.navigationHistory.at(-1);
    if (previous?.url === url) {
      return;
    }

    this.navigationHistory.push({
      url,
      timestamp: Date.now(),
    });
  }

  private trackNavigations(): () => void {
    const handleNavigation = (frame: Frame): void => {
      if (frame !== this.page.mainFrame()) {
        return;
      }

      this.recordNavigation(frame.url());
    };

    this.page.on('framenavigated', handleNavigation);

    return () => {
      this.page.off('framenavigated', handleNavigation);
    };
  }

  private parseJsonPayload(serialized: string, context: string): string {
    const payload = serialized.trim();
    try {
      const parsed: unknown = JSON.parse(payload);
      if (typeof parsed !== 'string') {
        throw new Error(
          `Expected ${context} to resolve to a string but received ${typeof parsed}`
        );
      }

      return parsed;
    } catch (error) {
      const base =
        error instanceof Error ? error.message : 'Unknown JSON parsing error';
      throw new Error(`Failed to parse ${context} payload ${payload}: ${base}`);
    }
  }

  private parseExpectationCondition(
    condition: string
  ):
    | { kind: 'visible' }
    | { kind: 'hidden' }
    | { kind: 'text'; strategy: 'equals' | 'contains'; expected: string }
    | { kind: 'value'; expected: string } {
    const trimmed = condition.trim();

    if (trimmed === 'to be visible') {
      return { kind: 'visible' };
    }

    if (trimmed === 'to be hidden') {
      return { kind: 'hidden' };
    }

    const textEqualsMatch = trimmed.match(/^to have text\s+(.*)$/);
    if (textEqualsMatch?.[1] !== undefined) {
      const expected = this.parseJsonPayload(
        textEqualsMatch[1],
        'text expectation'
      );
      return { kind: 'text', strategy: 'equals', expected };
    }

    const textContainsMatch = trimmed.match(/^to contain text\s+(.*)$/);
    if (textContainsMatch?.[1] !== undefined) {
      const expected = this.parseJsonPayload(
        textContainsMatch[1],
        'text expectation'
      );
      return { kind: 'text', strategy: 'contains', expected };
    }

    const valueMatch = trimmed.match(/^to have value\s+(.*)$/);
    if (valueMatch?.[1] !== undefined) {
      const expected = this.parseJsonPayload(
        valueMatch[1],
        'value expectation'
      );
      return { kind: 'value', expected };
    }

    throw new Error(
      `Unsupported expectation condition: ${condition}. Supported conditions: ${PlaywrightDriver.SUPPORTED_EXPECTATIONS.join(
        ', '
      )}`
    );
  }

  override async goto(url: string): Promise<void> {
    this.checkNotDestroyed();
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  override async reload(): Promise<void> {
    this.checkNotDestroyed();
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  override async back(): Promise<void> {
    this.checkNotDestroyed();
    await this.page.goBack({ waitUntil: 'domcontentloaded' });
  }

  override async forward(): Promise<void> {
    this.checkNotDestroyed();
    await this.page.goForward({ waitUntil: 'domcontentloaded' });
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
    const normalized = Array.isArray(options) ? options : [options];
    const result = await this.page.selectOption(selector, normalized);

    if (!result.length) {
      throw new Error(
        `PlaywrightDriver: failed to select option(s) ${JSON.stringify(
          normalized
        )} for selector "${selector}"`
      );
    }
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

    const expectation = this.parseExpectationCondition(condition);

    if (expectation.kind === 'visible') {
      await this.page.waitForSelector(selector, { state: 'visible' });
      return;
    }

    if (expectation.kind === 'hidden') {
      await this.page.waitForSelector(selector, { state: 'hidden' });
      return;
    }
    if (expectation.kind === 'text') {
      const content = await this.page.textContent(selector);
      if (expectation.strategy === 'equals') {
        if ((content ?? '').trim() !== expectation.expected) {
          throw new Error(
            `Expected element "${selector}" to have text ${JSON.stringify(
              expectation.expected
            )}, received ${JSON.stringify(content ?? '')}`
          );
        }
        return;
      }

      if (!content?.includes(expectation.expected)) {
        throw new Error(
          `Expected element "${selector}" to contain text ${JSON.stringify(
            expectation.expected
          )}, received ${JSON.stringify(content ?? '')}`
        );
      }
      return;
    }

    const value = await this.getValue(selector);
    if (value !== expectation.expected) {
      throw new Error(
        `Expected element "${selector}" to have value ${JSON.stringify(
          expectation.expected
        )}, received ${JSON.stringify(value)}`
      );
    }
  }

  override async getText(selector: string): Promise<string> {
    this.checkNotDestroyed();
    const content = await this.page.textContent(selector);
    return content ?? '';
  }

  override async getValue(selector: string): Promise<string> {
    this.checkNotDestroyed();
    const elementHandle = await this.page.$(selector);
    if (!elementHandle) {
      throw new Error(
        `PlaywrightDriver: cannot get value, selector not found: ${selector}`
      );
    }

    const tagName = await elementHandle.evaluate((element) =>
      element.tagName.toLowerCase()
    );

    const value = await elementHandle.evaluate((element) => {
      if (element instanceof HTMLSelectElement) {
        return Array.from(element.selectedOptions).map(
          (option) => option.value
        );
      }

      if (element instanceof HTMLInputElement) {
        if (element.type === 'checkbox') {
          return element.checked ? 'true' : 'false';
        }

        if (element.type === 'radio') {
          return element.checked ? element.value : '';
        }

        return element.value ?? '';
      }

      if (element instanceof HTMLTextAreaElement) {
        return element.value ?? '';
      }

      return element.textContent ?? '';
    });

    await elementHandle.dispose();

    if (Array.isArray(value)) {
      return value.join(',');
    }

    if (typeof value === 'string') {
      return value;
    }

    throw new Error(
      `PlaywrightDriver: unsupported value type retrieved for selector "${selector}" (tag: ${tagName})`
    );
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

    this.stopTrackingNavigations();
    await this.page.close();
    await this.context.close();
    await this.browser.close();
    await super.destroy();
  }
}
