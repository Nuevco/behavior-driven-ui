/**
 * Lint validation file - this code should trigger specific ESLint errors
 * These errors are EXPECTED and validate our linting configuration works
 */

// INTENTIONAL ERROR: Import order violation (external after internal)
import { validateConfig } from './type-tests.js';
import { readFile } from 'fs/promises';

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

// INTENTIONAL ERROR: promise/catch-or-return violation
export async function testPromiseRules(): Promise<string[]> {
  const results: string[] = [];

  // INTENTIONAL ERROR: Missing catch or return on promise
  Promise.resolve('test1').then((data) => {
    results.push(data);
    return `processed-${data}`;
  });

  try {
    await Promise.resolve('test2');
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

// INTENTIONAL ERROR: security/detect-object-injection violation
export function testSecurityRules(userInput: unknown): ProcessingResult {
  if (typeof userInput !== 'object' || userInput === null) {
    return { success: false, error: new Error('Invalid input type') };
  }

  // INTENTIONAL ERROR: Direct property access without validation
  const obj = userInput as Record<string, unknown>;
  const dangerousKey = 'constructor';

  // This should trigger security/detect-object-injection
  const result = obj[dangerousKey];

  return { success: true, data: result };
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

// INTENTIONAL ERROR: Complexity rule violation (max: 15)
export function testComplexityRuleViolation(input: number, type: string, options: Record<string, unknown>): string {
  // This function should exceed the complexity limit with multiple nested conditions
  if (input < 0) {
    if (type === 'negative') {
      if (options.strict) {
        if (options.errorMode) {
          if (options.throwError) {
            throw new Error('Negative input in strict mode');
          } else {
            return 'error-negative-strict';
          }
        } else {
          return 'negative-strict';
        }
      } else {
        return 'negative';
      }
    } else if (type === 'auto') {
      return 'negative-auto';
    } else {
      return 'negative-unknown';
    }
  } else if (input === 0) {
    if (type === 'zero') {
      return 'zero-explicit';
    } else {
      return 'zero-implicit';
    }
  } else if (input < 10) {
    if (type === 'small') {
      if (options.precision) {
        return 'small-precise';
      } else {
        return 'small-normal';
      }
    } else {
      return 'small-auto';
    }
  } else if (input < 100) {
    if (type === 'medium') {
      return 'medium-explicit';
    } else {
      return 'medium-auto';
    }
  } else {
    return 'large';
  }
}

// Export default for module testing
export default {
  testImportRules,
  testPromiseRules,
  testComplexityRules,
  testSecurityRules,
  testParameterLimits,
};
