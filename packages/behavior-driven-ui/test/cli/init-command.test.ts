import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

async function createTempWorkspace(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bdui-init-test-'));
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'temp-init-project', version: '0.0.0' }),
    { encoding: 'utf8' }
  );
  return dir;
}

async function removeDirectory(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

describe('executeInit', () => {
  const tempDirs: string[] = [];

  beforeEach(() => {
    tempDirs.length = 0;
  });

  afterEach(async () => {
    await Promise.all(tempDirs.map((dir) => removeDirectory(dir)));
    tempDirs.length = 0;
  });

  it('creates default config, feature, and step assets when missing', async () => {
    const tempDir = await createTempWorkspace();
    tempDirs.push(tempDir);

    const { executeInit } = await import('../../src/cli/init/execute-init.js');

    const result = await executeInit({ cwd: tempDir });

    const configPath = path.join(tempDir, 'bdui.config.ts');
    const featureKeepPath = path.join(tempDir, 'features', '.gitkeep');
    const stepKeepPath = path.join(tempDir, 'bdui', 'steps', '.gitkeep');

    expect(result.configPath).toBe(configPath);
    expect(result.createdFiles).toEqual(
      expect.arrayContaining([configPath, featureKeepPath, stepKeepPath])
    );

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const configContents = await fs.readFile(configPath, 'utf8');

    expect(configContents).toContain("baseURL: 'http://localhost:5173'");
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const featureKeepContents = await fs.readFile(featureKeepPath, 'utf8');
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stepKeepContents = await fs.readFile(stepKeepPath, 'utf8');

    expect(featureKeepContents).toBe('');
    expect(stepKeepContents).toBe('');

    const nonexistentStepPath = path.join(
      tempDir,
      'bdui',
      'steps',
      'example.steps.ts'
    );
    await expect(fs.access(nonexistentStepPath)).rejects.toThrow();

    const secondRun = await executeInit({ cwd: tempDir });

    expect(secondRun.createdFiles).toHaveLength(0);
    expect(secondRun.skippedFiles).toEqual(
      expect.arrayContaining([configPath, featureKeepPath, stepKeepPath])
    );
  });

  it('respects a custom configuration path override', async () => {
    const tempDir = await createTempWorkspace();
    tempDirs.push(tempDir);

    const { executeInit } = await import('../../src/cli/init/execute-init.js');

    const customPath = path.join('config', 'bdui.custom.ts');
    const result = await executeInit({ cwd: tempDir, config: customPath });

    const expectedPath = path.join(tempDir, customPath);
    expect(result.configPath).toBe(expectedPath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const configContents = await fs.readFile(expectedPath, 'utf8');
    expect(configContents).toContain("features: ['features/**/*.feature']");
  });
});
