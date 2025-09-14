const freePaths = require('@nuevco/free-paths');

export class PathTester {
  testGetCurrentDir(): string {
    return freePaths.getCurrentDir();
  }

  testGetCurrentFile(): string {
    return freePaths.getCurrentFile();
  }

  testGetProjectRoot(): string {
    return freePaths.getProjectRoot();
  }

  runAllTests(): Record<string, string> {
    return {
      currentDir: this.testGetCurrentDir(),
      currentFile: this.testGetCurrentFile(),
      projectRoot: this.testGetProjectRoot(),
    };
  }
}

module.exports = { PathTester };
