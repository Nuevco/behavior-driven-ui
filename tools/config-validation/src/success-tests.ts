/**
 * Success validation file - this code should pass all our strict rules
 */

import { readFile } from 'fs/promises';

// Clean interface following our rules
interface CleanConfig {
  readonly name: string;
  readonly version: number;
  readonly features?: readonly string[];
}

// Function that should pass all complexity and style rules
export async function validateCleanConfig(
  config: CleanConfig
): Promise<boolean> {
  try {
    // Proper null checking and optional chaining
    const features = config.features ?? [];
    const hasFeatures = features.length > 0;

    // Simple validation logic under complexity limits
    if (config.name.length === 0) {
      return false;
    }

    if (config.version <= 0) {
      return false;
    }

    return hasFeatures || features.length === 0;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console, no-undef
    console.error(`Validation error: ${errorMessage}`);
    return false;
  }
}

// Proper async/await usage
export async function processConfigFile(): Promise<CleanConfig | null> {
  try {
    const content = await readFile('package.json', 'utf8');
    const data = JSON.parse(content) as unknown;

    // Proper type guards
    if (
      typeof data === 'object' &&
      data !== null &&
      'name' in data &&
      'version' in data
    ) {
      const obj = data as Record<string, unknown>;

      if (typeof obj.name === 'string' && typeof obj.version === 'string') {
        return {
          name: obj.name,
          version: parseFloat(obj.version.split('.')[0] ?? '0'),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Export default for clean module pattern
export default {
  validateCleanConfig,
  processConfigFile,
};
