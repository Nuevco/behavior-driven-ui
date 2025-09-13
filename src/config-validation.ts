/**
 * Configuration validation test file
 * This file tests our strict TypeScript and ESLint configuration
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

// Test that would fail with any/unknown types (should be caught by our rules)
export function strictTypingTest(data: unknown): TestConfig {
  // This should require proper type guards per our strict rules
  if (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    'version' in data
  ) {
    const obj = data as Record<string, unknown>;

    if (typeof obj.name === 'string' && typeof obj.version === 'number') {
      const features = Array.isArray(obj.features)
        ? obj.features.filter((f): f is string => typeof f === 'string')
        : undefined;

      return {
        name: obj.name,
        version: obj.version,
        ...(features && { features: features as readonly string[] }),
      };
    }
  }

  throw new Error('Invalid configuration data');
}

// Export default for module testing
const defaultConfig: TestConfig = {
  name: 'behavior-driven-ui',
  version: 1,
  features: ['testing', 'typescript', 'eslint'],
};

export default defaultConfig;
