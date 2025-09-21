import path from 'node:path';

import fg from 'fast-glob';

const STEP_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

export interface ResolveStepFilesOptions {
  readonly projectRoot: string;
  readonly stepGlobs: readonly string[];
}

/**
 * Resolve step definition files based on the configured globs.
 *
 * The order of results matches the order provided by the globs while removing
 * duplicates and ignoring files with unsupported extensions. All returned paths
 * are absolute.
 */
export async function resolveStepFiles(
  options: ResolveStepFilesOptions
): Promise<string[]> {
  if (!options.stepGlobs.length) {
    return [];
  }

  const globResults = await fg(Array.from(options.stepGlobs), {
    cwd: options.projectRoot,
    absolute: true,
    dot: false,
    unique: false,
    followSymbolicLinks: false,
  });

  const seen = new Set<string>();
  const resolved: string[] = [];

  for (const candidate of globResults) {
    const normalized = path.resolve(candidate);
    const extension = path.extname(normalized).toLowerCase();
    if (!STEP_FILE_EXTENSIONS.has(extension)) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    resolved.push(normalized);
  }

  return resolved;
}

export function resolveStepFilesFromConfig(
  projectRoot: string,
  stepGlobs: readonly string[]
): Promise<string[]> {
  return resolveStepFiles({ projectRoot, stepGlobs });
}
