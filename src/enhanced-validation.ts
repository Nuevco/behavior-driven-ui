/**
 * Enhanced validation file testing enterprise-level ESLint rules
 * Tests import/export, security, promise, complexity, and Node.js rules
 */

// Import order test (should be properly ordered by our rules)
import { readFile } from 'fs/promises';

import { validateConfig } from './config-validation.js';

// Interface for testing
interface ProcessingResult {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: Error;
}

// Test import/export management
export async function testImportRules(): Promise<ProcessingResult> {
  try {
    // Test proper Node.js import usage
    const content = await readFile('package.json', 'utf8');
    const config = JSON.parse(content) as Record<string, unknown>;

    // Type-safe validation - only call validateConfig if structure is valid
    if (
      typeof config === 'object' &&
      config !== null &&
      'name' in config &&
      'version' in config &&
      typeof config.name === 'string' &&
      typeof config.version === 'number'
    ) {
      const typedConfig = config as { name: string; version: number };
      return {
        success: validateConfig(typedConfig),
        data: config,
      };
    }

    return {
      success: false,
      error: new Error('Invalid package.json structure'),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// Test promise rules - proper async/await patterns
export async function testPromiseRules(): Promise<string[]> {
  const results: string[] = [];

  // Test promise chaining (promise/catch-or-return)
  try {
    await Promise.resolve('test1')
      .then((data) => {
        results.push(data);
        return `processed-${data}`;
      })
      .catch((error: Error) => {
        results.push(`error: ${error.message}`);
        return 'fallback';
      });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    results.push(`outer-error: ${errorMessage}`);
  }

  // Test proper promise creation (no promise/no-new-statics)
  const customPromise = new Promise<string>((resolve) => {
    // Use global setTimeout for Node.js environment
    globalThis.setTimeout(() => resolve('delayed-result'), 10);
  });

  const delayedResult = await customPromise;
  results.push(delayedResult);

  return results;
}

// Test complexity rules - keep functions under limits
export function testComplexityRules(input: number): string {
  // Simple function under complexity limit (max: 15)
  if (input < 0) {
    return 'negative';
  }

  if (input === 0) {
    return 'zero';
  }

  if (input < 10) {
    return 'small';
  }

  if (input < 100) {
    return 'medium';
  }

  return 'large';
}

// Test security rules - proper input validation
export function testSecurityRules(userInput: unknown): ProcessingResult {
  // Proper type checking to avoid security/detect-object-injection
  if (typeof userInput !== 'object' || userInput === null) {
    return { success: false, error: new Error('Invalid input type') };
  }

  // Safe property access
  const obj = userInput as Record<string, unknown>;
  const allowedKeys = ['name', 'version', 'features'];

  for (const key of Object.keys(obj)) {
    if (!allowedKeys.includes(key)) {
      return { success: false, error: new Error(`Unsafe property: ${key}`) };
    }
  }

  return { success: true, data: obj };
}

// Test parameter limits (max-params: 5)
export function testParameterLimits(
  param1: string,
  param2: number,
  param3: boolean,
  param4?: string[],
  param5?: Record<string, unknown>
): ProcessingResult {
  const result = {
    param1,
    param2,
    param3,
    param4: param4?.length ?? 0,
    param5: param5 ? Object.keys(param5).length : 0,
  };

  return { success: true, data: result };
}

// Export default for module testing
export default {
  testImportRules,
  testPromiseRules,
  testComplexityRules,
  testSecurityRules,
  testParameterLimits,
};
