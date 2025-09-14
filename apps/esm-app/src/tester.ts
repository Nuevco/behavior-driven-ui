import {
  getCurrentDir,
  getCurrentFile,
  getProjectRoot,
} from '@nuevco/free-paths';

export class PathTester {
  testGetCurrentDir(): string {
    return getCurrentDir();
  }

  testGetCurrentFile(): string {
    return getCurrentFile();
  }

  testGetProjectRoot(): string {
    return getProjectRoot();
  }

  runAllTests(): Record<string, string> {
    return {
      currentDir: this.testGetCurrentDir(),
      currentFile: this.testGetCurrentFile(),
      projectRoot: this.testGetProjectRoot(),
    };
  }
}
