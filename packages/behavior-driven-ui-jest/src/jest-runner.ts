/**
 * Jest runner implementation for behavior-driven tests
 */

import type {
  JestRunnerConfig,
  JestRunnerInstance,
  JestTestResult,
} from './types.js';

/**
 * Jest runner implementation for behavior-driven-ui
 */
export class JestRunner implements JestRunnerInstance {
  /**
   * Run tests with the given patterns
   */
  async runTests(_testPatterns?: string[]): Promise<JestTestResult> {
    // Simplified stub implementation for skeleton package
    return {
      success: true,
      numPassedTests: 0,
      numFailedTests: 0,
      numTotalTests: 0,
      executionTime: 0,
    };
  }

  /**
   * Watch for file changes and re-run tests
   */
  async watchTests(_testPatterns?: string[]): Promise<void> {
    // Simplified stub implementation for skeleton package
    throw new Error('watchTests not yet implemented');
  }

  /**
   * Stop the test runner
   */
  async stop(): Promise<void> {
    // Jest doesn't provide a direct API to stop a running instance
    // This would typically be handled by the calling code
    // by managing the Jest process lifecycle
  }

  /**
   * Create a Jest runner with behavior-driven defaults
   */
  static createBehaviorDrivenRunner(
    _config?: Partial<JestRunnerConfig>
  ): JestRunner {
    // Simplified stub implementation for skeleton package
    return new JestRunner();
  }
}

/**
 * Create and configure a Jest runner for behavior-driven tests
 */
export function createJestRunner(_config?: JestRunnerConfig): JestRunner {
  return new JestRunner();
}

/**
 * Create a Jest runner with behavior-driven defaults
 */
export function createBehaviorDrivenJestRunner(
  config?: Partial<JestRunnerConfig>
): JestRunner {
  return JestRunner.createBehaviorDrivenRunner(config);
}
