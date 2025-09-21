import { afterAll, describe, expect, it } from 'vitest';

import { createDriverForConfig } from '../../src/cucumber/driver/factory.js';
import { MockDriver } from '../../src/cucumber/mock-driver.js';
import type { BehaviorDrivenUIConfig } from '../../src/core/types.js';
import { PlaywrightDriver } from '../../src/driver/playwright/playwright-driver.js';

const BASE_CONFIG: BehaviorDrivenUIConfig = {
  baseURL: 'about:blank',
  features: ['features/**/*.feature'],
  steps: ['steps/**/*.ts'],
  driver: {
    kind: 'playwright',
    browser: 'chromium',
    headless: true,
  },
};

describe('createDriverForConfig', () => {
  const trackers: (MockDriver | PlaywrightDriver)[] = [];

  afterAll(async () => {
    for (const driver of trackers) {
      await driver.destroy();
    }
  });

  it('creates a Playwright driver by default', async () => {
    const driver = await createDriverForConfig({ ...BASE_CONFIG });
    trackers.push(driver);
    expect(driver).toBeInstanceOf(PlaywrightDriver);
  }, 20000);

  it('creates a mock driver when requested', async () => {
    const driver = await createDriverForConfig({
      ...BASE_CONFIG,
      driver: {
        kind: 'mock',
      },
    });
    trackers.push(driver);
    expect(driver).toBeInstanceOf(MockDriver);
  });
});
