/* eslint-disable security/detect-non-literal-fs-filename */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, it } from 'vitest';

import {
  resolveStepFiles,
  resolveStepFilesFromConfig,
} from '../../src/cli/steps/resolve-step-files.js';

async function createTempProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bdui-steps-test-'));
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'temp-project', version: '0.0.0' })
  );
  return dir;
}

async function writeFile(
  relativePath: string,
  projectDir: string
): Promise<string> {
  const fullPath = path.join(projectDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, '// test file', 'utf8');
  return fullPath;
}

async function cleanDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

const tempDirs: string[] = [];

beforeEach(() => {
  tempDirs.length = 0;
});

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => cleanDir(dir)));
  tempDirs.length = 0;
});

it('returns an empty array when no globs are provided', async () => {
  const projectDir = await createTempProject();
  tempDirs.push(projectDir);

  const result = await resolveStepFiles({
    projectRoot: projectDir,
    stepGlobs: [],
  });

  expect(result).toEqual([]);
});

it('resolves files matching the provided globs in order', async () => {
  const projectDir = await createTempProject();
  tempDirs.push(projectDir);

  const first = await writeFile('steps/a.steps.ts', projectDir);
  const second = await writeFile('steps/nested/b.steps.js', projectDir);
  await writeFile('steps/ignore.md', projectDir);

  const result = await resolveStepFiles({
    projectRoot: projectDir,
    stepGlobs: ['steps/**/*.steps.*'],
  });

  expect(result).toEqual([first, second]);
});

it('deduplicates overlapping globs while preserving order', async () => {
  const projectDir = await createTempProject();
  tempDirs.push(projectDir);

  const shared = await writeFile('steps/shared.ts', projectDir);
  const unique = await writeFile('steps/more/unique.js', projectDir);

  const result = await resolveStepFiles({
    projectRoot: projectDir,
    stepGlobs: ['steps/**/*.ts', 'steps/**/*.{ts,js}'],
  });

  expect(result).toEqual([shared, unique]);
});

it('filters files using unsupported extensions and integrates with config helper', async () => {
  const projectDir = await createTempProject();
  tempDirs.push(projectDir);

  const supported = await writeFile('custom/my-step.tsx', projectDir);
  await writeFile('custom/ignore-step.coffee', projectDir);

  const result = await resolveStepFilesFromConfig(projectDir, [
    'custom/**/*.*',
  ]);

  expect(result).toEqual([supported]);
});
