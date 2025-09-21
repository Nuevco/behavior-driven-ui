import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PlaywrightDriver } from '../../src/driver/playwright/playwright-driver.js';

const DATA_URL =
  'data:text/html,' +
  encodeURIComponent(
    '<!doctype html><html><body><h1 id="message">Hello BDUI</h1></body></html>'
  );

describe('PlaywrightDriver', () => {
  let driver: PlaywrightDriver;

  beforeAll(async () => {
    driver = await PlaywrightDriver.launch({ headless: true });
  }, 30000);

  afterAll(async () => {
    await driver.destroy();
  });

  it('navigates to a page and reads text content', async () => {
    await driver.goto(DATA_URL);
    await driver.waitFor('#message');

    const text = await driver.getText('#message');
    expect(text).toBe('Hello BDUI');
    expect(driver.visitedUrls.at(-1)?.url).toBe(DATA_URL);
  });

  it('updates and reads the viewport size', async () => {
    await driver.setViewport(1024, 768);
    const viewport = await driver.getViewport();

    expect(viewport).toEqual({ width: 1024, height: 768 });
  });
});
