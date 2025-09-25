/* eslint-disable no-console */
const { PathTester } = require('./tester');
const { existsSync } = require('fs');

describe('Free Paths CJS Tests', () => {
  const tester = new PathTester();

  test('getCurrentDir returns valid path', () => {
    const dir = tester.testGetCurrentDir();
    console.log('CJS Test: getCurrentDir() returned:', dir);
    console.log('CJS Test: __dirname is:', __dirname);
    expect(dir).toBe(__dirname);
  });

  test('getCurrentFile returns valid path', () => {
    const file = tester.testGetCurrentFile();
    const expectedFile = __dirname + '/tester.ts';
    console.log('CJS Test: getCurrentFile() returned:', file);
    console.log('CJS Test: expected file is:', expectedFile);
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
