/* eslint-disable no-console */
import { PathTester } from './tester.js';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

describe('Free Paths ESM Tests', () => {
  const tester = new PathTester();

  test('getCurrentDir returns valid path', () => {
    const dir = tester.testGetCurrentDir();
    const expectedDir = dirname(fileURLToPath(import.meta.url));
    console.log('ESM Test: getCurrentDir() returned:', dir);
    console.log('ESM Test: expected dir is:', expectedDir);
    expect(dir).toBe(expectedDir);
  });

  test('getCurrentFile returns valid path', () => {
    const file = tester.testGetCurrentFile();
    const expectedFile = dirname(fileURLToPath(import.meta.url)) + '/tester.ts';
    console.log('ESM Test: getCurrentFile() returned:', file);
    console.log('ESM Test: expected file is:', expectedFile);
    expect(file).toBe(expectedFile);
  });

  test('getProjectRoot finds monorepo root', () => {
    const root = tester.testGetProjectRoot();
    expect(existsSync(`${root}/package.json`)).toBe(true);
    expect(root).toContain('behavior-driven-ui');
  });

  test('all functions return absolute paths', () => {
    const results = tester.runAllTests();

    Object.values(results).forEach((path) => {
      expect(path.startsWith('/')).toBe(true); // Unix absolute path
    });
  });
});
