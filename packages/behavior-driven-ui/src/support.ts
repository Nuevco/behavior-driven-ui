/**
 * BDUI Support File - Loaded by cucumber.js at runtime
 * This file is loaded as a support file, so cucumber is already running
 * when this executes, eliminating dual instance problems.
 */

/* eslint-disable no-console, no-undef */
import { Given, Then, When, setWorldConstructor } from '@cucumber/cucumber';

import { World } from './core/world.js';
import type { Driver, WorldConfig } from './core/types.js';

console.log('🔧 Loading BDUI support from package...');

// Set our World as the constructor for all scenarios
setWorldConstructor(function (_options: unknown) {
  console.log('✅ BDUI World constructor called');
  // Create mock config for testing (real implementation would be more sophisticated)
  const mockDriver: Driver = {
    goto: async (url: string) => console.log(`Mock navigate to: ${url}`),
    reload: async () => console.log('Mock reload'),
    back: async () => console.log('Mock back'),
    forward: async () => console.log('Mock forward'),
    click: async (selector: string) => console.log(`Mock click: ${selector}`),
    type: async (selector: string, text: string) =>
      console.log(`Mock type into ${selector}: ${text}`),
    fill: async (selector: string, value: string) =>
      console.log(`Mock fill: ${selector} = ${value}`),
    select: async (selector: string, options: string | string[]) =>
      console.log(`Mock select on ${selector}: ${JSON.stringify(options)}`),
    waitFor: async (selector: string) =>
      console.log(`Mock wait for: ${selector}`),
    expect: async (selector: string, condition: string) =>
      console.log(`Mock expect ${selector} to be ${condition}`),
    getText: async (selector: string) => `Mock text for ${selector}`,
    getValue: async (selector: string) => `Mock value for ${selector}`,
    screenshot: async () => Buffer.from('mock-screenshot'),
    fullPageScreenshot: async (path: string) =>
      console.log(`Mock full page screenshot saved to ${path}`),
    setViewport: async (width: number, height: number) =>
      console.log(`Mock set viewport: ${width}x${height}`),
    getViewport: async () => ({ width: 1280, height: 720 }),
    destroy: async () => console.log('Mock driver destroyed'),
  };

  const testConfig: WorldConfig = {
    config: {
      baseURL: 'http://localhost:3000',
      features: [],
      steps: [],
    },
    driver: mockDriver,
  };
  return new World(testConfig);
});

// Register step definitions that users get "for free"
Given('I have a test world', function (this: World) {
  console.log('✅ BDUI Given step executed with World:', this.constructor.name);
});

When(
  'I store {string} as {string}',
  function (this: World, key: string, value: string) {
    this.setData(key, value);
    console.log(`✅ BDUI stored ${key} = ${value}`);
  }
);

Then(
  'I should be able to retrieve {string} as {string}',
  function (this: World, key: string, expectedValue: string) {
    const actualValue = this.getData<string>(key);
    if (actualValue !== expectedValue) {
      throw new Error(
        `Expected ${key} to be ${expectedValue}, but got ${actualValue}`
      );
    }
    console.log(`✅ BDUI retrieved ${key} = ${actualValue}`);
  }
);

console.log('✅ BDUI support loaded from package successfully');
