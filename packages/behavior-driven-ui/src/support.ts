/**
 * BDUI Support File - Loaded by cucumber.js at runtime
 * This file is loaded as a support file, so cucumber is already running
 * when this executes, eliminating dual instance problems.
 */

/* eslint-disable no-console, no-undef */
import { Given, Then, When, setWorldConstructor } from '@cucumber/cucumber';

import { World } from './core/world.js';

console.log('🔧 Loading BDUI support from package...');

// Set our World as the constructor for all scenarios
setWorldConstructor(function (_options: any) {
  console.log('✅ BDUI World constructor called');
  // Create mock config for testing (real implementation would be more sophisticated)
  const testConfig = {
    config: {
      baseURL: 'http://localhost:3000',
      features: [],
      steps: [],
    },
    driver: {
      goto: async (url: string) => console.log(`Mock navigate to: ${url}`),
      reload: async () => console.log('Mock reload'),
      back: async () => console.log('Mock back'),
      forward: async () => console.log('Mock forward'),
      click: async (selector: string) => console.log(`Mock click: ${selector}`),
      fill: async (selector: string, value: string) => console.log(`Mock fill: ${selector} = ${value}`),
      getText: async (selector: string) => `Mock text for ${selector}`,
      isVisible: async (selector: string) => true,
      waitFor: async (selector: string) => console.log(`Mock wait for: ${selector}`),
      screenshot: async () => Buffer.from('mock-screenshot'),
      evaluate: async (fn: Function) => fn(),
      getTitle: async () => 'Mock Title',
      getCurrentUrl: async () => 'http://localhost:3000',
      getCookies: async () => [],
      setCookie: async (cookie: any) => console.log('Mock set cookie:', cookie),
      destroy: async () => console.log('Mock driver destroyed'),
    },
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
