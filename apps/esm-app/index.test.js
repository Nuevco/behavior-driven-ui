import { PathTester } from './src/tester.js';
import { existsSync } from 'fs';

describe('Free Paths ESM Tests', () => {
  const tester = new PathTester();

  test('getCurrentDir returns valid path', () => {
    const dir = tester.testGetCurrentDir();
    expect(typeof dir).toBe('string');
    expect(existsSync(dir)).toBe(true);
    expect(dir).toMatch(/free-paths/); // Should contain package name
  });

  test('getCurrentFile returns valid path', () => {
    const file = tester.testGetCurrentFile();
    expect(file).toMatch(/\.(js|ts)$/);
    expect(existsSync(file)).toBe(true);
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
