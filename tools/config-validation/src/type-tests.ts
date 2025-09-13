/**
 * Type validation file - this code should trigger specific TypeScript errors
 * These errors are EXPECTED and validate our TypeScript strict configuration works
 */

// Test strict TypeScript settings
export interface TestConfig {
  readonly name: string;
  readonly version: number;
  readonly features?: readonly string[];
}

// Test function with strict typing
export function validateConfig(config: TestConfig): boolean {
  // Test nullish coalescing (required by our rules)
  const features = config.features ?? [];

  // Test optional chaining (required by our rules)
  const hasFeatures = (config.features?.length ?? 0) > 0;

  // Test prefer-const (required by our rules)
  const isValid = config.name.length > 0 && config.version > 0;

  return isValid && (hasFeatures || features.length === 0);
}

// Test async/await strict handling
export async function processConfig(config: TestConfig): Promise<string> {
  // This should require proper await handling per our strict rules
  return Promise.resolve(`Processed: ${config.name} v${config.version}`);
}

// INTENTIONAL ERRORS: TypeScript strict mode violations
export function strictTypingTest(data: unknown): TestConfig {
  // INTENTIONAL ERROR: Using 'any' type (should be caught by @typescript-eslint/no-explicit-any)
  const obj = data as any;

  // INTENTIONAL ERROR: Type mismatch - assigning string to number
  const badVersion: number = obj.name;

  // INTENTIONAL ERROR: Property doesn't exist on type
  const nonExistent: string = obj.thisPropertyDoesNotExist;

  return {
    name: nonExistent,
    version: badVersion,
    features: obj.features,
  };
}

// INTENTIONAL ERROR: Another type mismatch
export function anotherTypeError(): void {
  const numberValue: number = 'this is a string'; // Type error
  const stringValue: string = numberValue; // Another type error
}

// Export default for module testing
const defaultConfig: TestConfig = {
  name: 'behavior-driven-ui',
  version: 1,
  features: ['testing', 'typescript', 'eslint'],
};

export default defaultConfig;
