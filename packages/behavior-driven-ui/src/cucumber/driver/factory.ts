import type { BehaviorDrivenUIConfig } from '../../core/types.js';
import { PlaywrightDriver } from '../../driver/playwright/playwright-driver.js';
import { MockDriver } from '../mock-driver.js';

export type SupportedDriver = MockDriver | PlaywrightDriver;

function resolveDriverKind(
  config: BehaviorDrivenUIConfig
): NonNullable<BehaviorDrivenUIConfig['driver']>['kind'] {
  return config.driver?.kind ?? 'playwright';
}

export async function createDriverForConfig(
  config: BehaviorDrivenUIConfig
): Promise<SupportedDriver> {
  const kind = resolveDriverKind(config);

  switch (kind) {
    case 'playwright':
      return PlaywrightDriver.launch({
        browser: config.driver?.browser ?? 'chromium',
        headless: config.driver?.headless ?? true,
      });
    case 'mock':
      return new MockDriver();
    default:
      throw new Error(
        `Driver kind "${kind}" is not supported yet. Available options: playwright, mock.`
      );
  }
}
