/**
 * @nuevco/free-paths - Universal path resolution that works in either module system
 *
 * Provides consistent path resolution utilities that work identically in both
 * ESM and CJS environments without fragile conditional logic.
 */

import { dirname } from 'path';

import callsites from 'callsites';
import pkgDir from 'pkg-dir';

/**
 * Gets the directory of the current file (caller)
 * Equivalent to __dirname but works in both ESM and CJS
 */
export const getCurrentDir = (): string => {
  const sites = callsites();
  const fileName = sites[1]?.getFileName();
  if (!fileName) {
    throw new Error('Could not determine current file name');
  }
  return dirname(fileName);
};

/**
 * Gets the full path of the current file (caller)
 * Equivalent to __filename but works in both ESM and CJS
 */
export const getCurrentFile = (): string => {
  const sites = callsites();
  const fileName = sites[1]?.getFileName();
  if (!fileName) {
    throw new Error('Could not determine current file name');
  }
  return fileName;
};

/**
 * Gets the project root directory by finding the nearest package.json
 * @param startFrom - Directory to start searching from (defaults to caller's directory)
 */
export const getProjectRoot = (startFrom?: string): string => {
  const searchFrom = startFrom ?? getCurrentDir();
  const root = pkgDir.sync(searchFrom);
  if (!root) {
    throw new Error(`Could not find package.json starting from: ${searchFrom}`);
  }
  return root;
};
