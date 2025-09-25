/**
 * FileManager - Abstracts file system operations for testability
 */

import { access } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export interface IFileManager {
  /** Check if a file exists and is accessible */
  isFileAccessible(filePath: string): Promise<boolean>;

  /** Convert file path to URL for dynamic imports */
  pathToFileURL(filePath: string): URL;

  /** Dynamically import a module from file URL */
  importModule(moduleUrl: string): Promise<unknown>;
}

/**
 * NodeFileManager - Production implementation using node:fs and node:url
 */
export class NodeFileManager implements IFileManager {
  public async isFileAccessible(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  public pathToFileURL(filePath: string): URL {
    return pathToFileURL(filePath);
  }

  public async importModule(moduleUrl: string): Promise<unknown> {
    return import(moduleUrl);
  }
}

/**
 * Get the default file manager instance
 */
export function getFileManager(): IFileManager {
  return new NodeFileManager();
}
