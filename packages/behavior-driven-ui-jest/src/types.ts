/**
 * Jest-specific type definitions
 */

import type { Config } from 'jest';

/**
 * Configuration options for Jest runner
 */
export interface JestRunnerConfig {
  /** Jest configuration object */
  jestConfig?: Partial<Config>;
  /** Test timeout in milliseconds */
  testTimeout?: number;
  /** Setup files to run before tests */
  setupFiles?: string[];
  /** Setup files to run after jest environment is set up */
  setupFilesAfterEnv?: string[];
  /** Test environment (jsdom, node, etc.) */
  testEnvironment?: string;
  /** Test name patterns to run */
  testNamePattern?: string;
  /** Test file patterns */
  testMatch?: string[];
  /** Coverage configuration */
  collectCoverage?: boolean;
  /** Coverage threshold */
  coverageThreshold?: Config['coverageThreshold'];
}

/**
 * Jest test result information
 */
export interface JestTestResult {
  /** Whether all tests passed */
  success: boolean;
  /** Number of tests that passed */
  numPassedTests: number;
  /** Number of tests that failed */
  numFailedTests: number;
  /** Total number of tests */
  numTotalTests: number;
  /** Test execution time in milliseconds */
  executionTime: number;
  /** Coverage information if enabled */
  coverage?: unknown;
}

/**
 * Jest runner instance
 */
export interface JestRunnerInstance {
  /** Run tests with the given patterns */
  runTests(testPatterns?: string[]): Promise<JestTestResult>;
  /** Watch for file changes and re-run tests */
  watchTests(testPatterns?: string[]): Promise<void>;
  /** Stop the test runner */
  stop(): Promise<void>;
}
