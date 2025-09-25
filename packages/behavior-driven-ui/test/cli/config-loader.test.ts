/* eslint-disable security/detect-non-literal-fs-filename */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, it } from 'vitest';

import {
  BduiConfigError,
  loadBduiConfig,
} from '../../src/cli/config/loader.js';

async function createTempProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bdui-config-test-'));
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'temp-project', version: '0.0.0' })
  );
  return dir;
}

async function writeConfig(
  dir: string,
  filename: string,
  contents: string
): Promise<string> {
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, contents, { encoding: 'utf8' });
  return filePath;
}

async function removeDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

const createdDirs: string[] = [];

beforeEach(() => {
  createdDirs.length = 0;
});

afterEach(async () => {
  await Promise.all(createdDirs.map((dir) => removeDir(dir)));
  createdDirs.length = 0;
});

it('returns defaults when no config file is present', async () => {
  const projectDir = await createTempProject();
  createdDirs.push(projectDir);

  const result = await loadBduiConfig({ cwd: projectDir });

  expect(result.configFilePath).toBeNull();
  expect(result.rawConfig).toBeNull();
  expect(result.resolvedConfig).toMatchObject({
    projectRoot: projectDir,
    webServer: {
      command: 'echo "No command configured"',
      port: 5173,
      baseURL: 'http://localhost:5173',
    },
    features: ['features/**/*.feature'],
    steps: ['bdui/steps/**/*.{ts,js}'],
    driver: {
      browser: 'chromium',
      headless: true,
    },
    cucumber: {
      tagExpression: '',
      order: 'defined',
    },
    environment: {},
  });
});

it('loads and validates config from the first matching file', async () => {
  const projectDir = await createTempProject();
  createdDirs.push(projectDir);

  await writeConfig(
    projectDir,
    'bdui.config.mjs',
    `export default {
      webServer: { command: 'echo "test"', port: 3000, baseURL: 'https://example.test' },
      features: 'tests/features/**/*.feature',
      driver: {
        browser: 'firefox',
      },
      cucumber: {
        tagExpression: '@smoke',
      },
      environment: {
        NODE_ENV: 'test'
      }
    };
    `
  );

  const result = await loadBduiConfig({ cwd: projectDir });
  const expectedPath = path.join(projectDir, 'bdui.config.mjs');

  expect(result.configFilePath).toBe(expectedPath);
  expect(result.rawConfig).toMatchObject({
    webServer: {
      command: 'echo "test"',
      port: 3000,
      baseURL: 'https://example.test',
    },
    features: 'tests/features/**/*.feature',
    driver: { browser: 'firefox' },
    cucumber: { tagExpression: '@smoke' },
    environment: { NODE_ENV: 'test' },
  });
  expect(result.resolvedConfig).toMatchObject({
    webServer: { baseURL: 'https://example.test' },
    features: ['tests/features/**/*.feature'],
    steps: ['bdui/steps/**/*.{ts,js}'],
    driver: { browser: 'firefox', headless: true },
    cucumber: { tagExpression: '@smoke', order: 'defined' },
    environment: { NODE_ENV: 'test' },
  });
});

it('uses an explicit config override when provided', async () => {
  const projectDir = await createTempProject();
  createdDirs.push(projectDir);

  await writeConfig(
    projectDir,
    'bdui.config.mjs',
    'export default { webServer: { command: "echo test", port: 3000, baseURL: "https://example.test" } };'
  );

  const overrideDir = await createTempProject();
  createdDirs.push(overrideDir);

  await writeConfig(
    overrideDir,
    'custom.config.mjs',
    `export default {
      webServer: {
        command: 'echo "test"',
        port: 3000,
        baseURL: 'https://override.test'
      },
      driver: { headless: false }
    };`
  );

  const overridePath = path.join(overrideDir, 'custom.config.mjs');
  const result = await loadBduiConfig({
    cwd: overrideDir,
    configPathOverride: overridePath,
  });

  expect(result.configFilePath).toBe(overridePath);
  expect(result.resolvedConfig.webServer.baseURL).toBe('https://override.test');
  expect(result.resolvedConfig.driver.headless).toBe(false);
});

it('throws a descriptive error when validation fails', async () => {
  const projectDir = await createTempProject();
  createdDirs.push(projectDir);

  await writeConfig(
    projectDir,
    'bdui.config.mjs',
    `export default {
      driver: {
        browser: 'safari'
      }
    };
    `
  );

  await expect(loadBduiConfig({ cwd: projectDir })).rejects.toThrow(
    BduiConfigError
  );
});
