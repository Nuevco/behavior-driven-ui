import assert from 'node:assert/strict';

import type { DataTable } from '@cucumber/cucumber';

import type { BehaviorDrivenUIConfig, Driver } from '../../core/types.js';
import { World } from '../../core/world.js';
import { createDriverForConfig } from '../driver/factory.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StepDefinitionCode = (...args: any[]) => unknown | Promise<unknown>;

export interface StepDefinitionMethods {
  Given(pattern: string | RegExp, code: StepDefinitionCode): void;
  When(pattern: string | RegExp, code: StepDefinitionCode): void;
  Then(pattern: string | RegExp, code: StepDefinitionCode): void;
  Before(code: StepDefinitionCode): void;
  After(code: StepDefinitionCode): void;
  setWorldConstructor(constructorFn: new () => unknown): void;
}

export interface StepLibraryOptions {
  defaultConfig?: Partial<BehaviorDrivenUIConfig>;
}

interface TrackingDriver extends Driver {
  resetHistory(): void;
  readonly visitedUrls: readonly { url: string; timestamp: number }[];
}

interface StepWorld extends World {
  driver: TrackingDriver;
  ensureTrackingDriver(): Promise<TrackingDriver>;
}

const DEFAULT_DRIVER_CONFIG = {
  kind: 'playwright' as const,
  browser: 'chromium' as const,
  headless: true,
};

function cloneConfig(base: BehaviorDrivenUIConfig): BehaviorDrivenUIConfig {
  const cloned: BehaviorDrivenUIConfig = {
    baseURL: base.baseURL,
    features: [...base.features],
    steps: [...base.steps],
  };

  if (base.driver) {
    cloned.driver = { ...base.driver };
  }

  if (base.webServer) {
    cloned.webServer = { ...base.webServer };
  }

  if (base.breakpoints) {
    cloned.breakpoints = {
      ...base.breakpoints,
      ...(base.breakpoints.override
        ? { override: { ...base.breakpoints.override } }
        : {}),
    };
  }

  if (base.mocks) {
    cloned.mocks = { ...base.mocks };
  }

  if (base.tags) {
    cloned.tags = { ...base.tags };
  }

  return cloned;
}

function buildDefaultConfig(
  options: StepLibraryOptions
): BehaviorDrivenUIConfig {
  const defaultConfig = options.defaultConfig ?? {};
  const defaults: BehaviorDrivenUIConfig = {
    baseURL: defaultConfig.baseURL ?? 'about:blank',
    features: [...(defaultConfig.features ?? [])],
    steps: [...(defaultConfig.steps ?? [])],
    driver: { ...(defaultConfig.driver ?? DEFAULT_DRIVER_CONFIG) },
  };

  if (defaultConfig.webServer) {
    defaults.webServer = { ...defaultConfig.webServer };
  }

  const breakpoints = defaultConfig.breakpoints;
  if (breakpoints) {
    const { override, ...rest } = breakpoints;
    defaults.breakpoints = {
      ...rest,
      ...(override ? { override: { ...override } } : {}),
    };
  }

  if (defaultConfig.mocks) {
    defaults.mocks = { ...defaultConfig.mocks };
  }

  if (defaultConfig.tags) {
    defaults.tags = { ...defaultConfig.tags };
  }

  return defaults;
}

function registerHooks(methods: StepDefinitionMethods): void {
  methods.Before(async function (this: StepWorld) {
    await this.beforeScenario();
  } as StepDefinitionCode);

  methods.After(async function (this: StepWorld) {
    await this.afterScenario();
    await this.destroy();
  } as StepDefinitionCode);
}

function registerWorldManagementSteps(methods: StepDefinitionMethods): void {
  methods.Given('a fresh BDUI test world', async function (this: StepWorld) {
    this.clearData();
    const driver = await this.ensureTrackingDriver();
    driver.resetHistory();
  } as StepDefinitionCode);

  methods.Given(
    'a BDUI world configured with base url {string}',
    async function (this: StepWorld, baseUrl: string) {
      this.config.baseURL = baseUrl;
      const driver = await this.ensureTrackingDriver();
      driver.resetHistory();
      await this.beforeScenario();
    } as StepDefinitionCode
  );

  methods.When('I trigger the scenario setup', async function (
    this: StepWorld
  ) {
    const driver = await this.ensureTrackingDriver();
    driver.resetHistory();
    await this.beforeScenario();
  } as StepDefinitionCode);
}

function registerDataSteps(methods: StepDefinitionMethods): void {
  methods.When('I store {string} as {string}', function (
    this: StepWorld,
    value: string,
    key: string
  ) {
    this.setData(key, value);
  } as StepDefinitionCode);

  methods.Then('the data for {string} should be {string}', function (
    this: StepWorld,
    key: string,
    expectedValue: string
  ) {
    const actual = this.getData<string>(key);
    assert.equal(
      actual,
      expectedValue,
      `Expected stored data for "${key}" to equal "${expectedValue}", received "${actual ?? 'undefined'}"`
    );
  } as StepDefinitionCode);

  methods.Then('the data for {string} should be absent', function (
    this: StepWorld,
    key: string
  ) {
    const actual = this.getData<unknown>(key);
    assert.equal(
      actual,
      undefined,
      `Expected no stored data for "${key}", but received ${JSON.stringify(actual)}`
    );
  } as StepDefinitionCode);
}

function registerFormSteps(methods: StepDefinitionMethods): void {
  methods.When('I fill {string} with {string}', async function (
    this: StepWorld,
    selector: string,
    value: string
  ) {
    const driver = await this.ensureTrackingDriver();
    await driver.fill(selector, value);
  } as StepDefinitionCode);

  methods.When('I type {string} into {string}', async function (
    this: StepWorld,
    text: string,
    selector: string
  ) {
    const driver = await this.ensureTrackingDriver();
    await driver.type(selector, text);
  } as StepDefinitionCode);

  methods.When('I click {string}', async function (
    this: StepWorld,
    selector: string
  ) {
    const driver = await this.ensureTrackingDriver();
    await driver.click(selector);
  } as StepDefinitionCode);

  methods.When('I select {string} from {string}', async function (
    this: StepWorld,
    option: string,
    selector: string
  ) {
    const driver = await this.ensureTrackingDriver();
    await driver.select(selector, option);
  } as StepDefinitionCode);

  methods.When('I select the following options from {string}:', async function (
    this: StepWorld,
    selector: string,
    table: DataTable
  ) {
    const driver = await this.ensureTrackingDriver();
    const values = table
      .raw()
      .flat()
      .map((entry) => entry.trim());
    await driver.select(selector, values);
  } as StepDefinitionCode);
}

function registerAssertionSteps(methods: StepDefinitionMethods): void {
  methods.Then('the value of {string} should be {string}', async function (
    this: StepWorld,
    selector: string,
    expectedValue: string
  ) {
    const driver = await this.ensureTrackingDriver();
    await driver.expect(
      selector,
      `to have value ${JSON.stringify(expectedValue)}`
    );
  } as StepDefinitionCode);

  methods.Then('the values of {string} should be:', async function (
    this: StepWorld,
    selector: string,
    table: DataTable
  ) {
    const driver = await this.ensureTrackingDriver();
    const values = table
      .raw()
      .flat()
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    const actual = await driver.getValue(selector);
    const actualValues = actual
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    assert.deepEqual(
      actualValues,
      values,
      `Expected selected values for "${selector}" to equal ${JSON.stringify(values)}, received ${JSON.stringify(actualValues)}`
    );
  } as StepDefinitionCode);

  methods.Then('the text of {string} should be {string}', async function (
    this: StepWorld,
    selector: string,
    expectedText: string
  ) {
    const driver = await this.ensureTrackingDriver();
    await driver.expect(
      selector,
      `to have text ${JSON.stringify(expectedText)}`
    );
  } as StepDefinitionCode);

  methods.Then('{string} should contain text {string}', async function (
    this: StepWorld,
    selector: string,
    expectedText: string
  ) {
    const driver = await this.ensureTrackingDriver();
    await driver.expect(
      selector,
      `to contain text ${JSON.stringify(expectedText)}`
    );
  } as StepDefinitionCode);

  methods.Then('{string} should be visible', async function (
    this: StepWorld,
    selector: string
  ) {
    const driver = await this.ensureTrackingDriver();
    await driver.expect(selector, 'to be visible');
  } as StepDefinitionCode);

  methods.Then('{string} should be hidden', async function (
    this: StepWorld,
    selector: string
  ) {
    const driver = await this.ensureTrackingDriver();
    await driver.expect(selector, 'to be hidden');
  } as StepDefinitionCode);
}

function registerViewportSteps(methods: StepDefinitionMethods): void {
  methods.When('I set the viewport to {int} by {int}', async function (
    this: StepWorld,
    width: number,
    height: number
  ) {
    await this.ensureTrackingDriver();
    await this.driver.setViewport(width, height);
  } as StepDefinitionCode);

  methods.Then('the viewport size should be {int} by {int}', async function (
    this: StepWorld,
    width: number,
    height: number
  ) {
    await this.ensureTrackingDriver();
    const viewport = await this.driver.getViewport();
    assert.deepEqual(viewport, { width, height });
  } as StepDefinitionCode);
}

function registerNavigationSteps(methods: StepDefinitionMethods): void {
  methods.Then('the driver should have navigated to {string}', function (
    this: StepWorld,
    expectedUrl: string
  ) {
    const visited = this.driver.visitedUrls.map((entry) => entry.url);
    assert.ok(
      visited.includes(expectedUrl),
      `Expected navigation history ${JSON.stringify(visited)} to include "${expectedUrl}"`
    );
  } as StepDefinitionCode);
}

export function registerCoreStepLibrary(
  methods: StepDefinitionMethods,
  options: StepLibraryOptions = {}
): void {
  const defaults = buildDefaultConfig(options);

  class BduiCucumberWorld extends World implements StepWorld {
    constructor() {
      const config = cloneConfig(defaults);
      super({
        config,
        driverFactory: async () => createDriverForConfig(config),
      });
    }

    public override get driver(): TrackingDriver {
      const driver = super.driver;
      return driver as TrackingDriver;
    }

    public async ensureTrackingDriver(): Promise<TrackingDriver> {
      const driver = await this.ensureDriver();
      return driver as TrackingDriver;
    }
  }

  methods.setWorldConstructor(
    BduiCucumberWorld as unknown as new () => StepWorld
  );
  registerHooks(methods);
  registerWorldManagementSteps(methods);
  registerDataSteps(methods);
  registerFormSteps(methods);
  registerAssertionSteps(methods);
  registerViewportSteps(methods);
  registerNavigationSteps(methods);
}
