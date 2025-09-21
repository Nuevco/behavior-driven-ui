/* global process */
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getProjectRoot } from '@nuevco/free-paths';

const DEFAULT_CONFIG_FILENAME = 'bdui.config.ts';
const SAMPLE_CONFIG_CONTENT = `export default {
  baseURL: 'http://localhost:3000',
  features: ['features/**/*.feature'],
  steps: ['bdui/steps/**/*.{ts,js}'],
};
`;
const GITKEEP_FILENAME = '.gitkeep';

interface FileScaffold {
  readonly path: string;
  readonly content: string;
}

interface DirectoryScaffold {
  readonly path: string;
}

export interface ExecuteInitOptions {
  readonly cwd?: string;
  readonly config?: string;
}

export interface ExecuteInitResult {
  readonly projectRoot: string;
  readonly configPath: string;
  readonly createdFiles: string[];
  readonly skippedFiles: string[];
  readonly createdDirectories: string[];
  readonly skippedDirectories: string[];
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(scaffold: DirectoryScaffold): Promise<boolean> {
  if (await pathExists(scaffold.path)) {
    return false;
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(scaffold.path, { recursive: true });
  return true;
}

async function ensureFile(scaffold: FileScaffold): Promise<boolean> {
  if (await pathExists(scaffold.path)) {
    return false;
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(path.dirname(scaffold.path), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(scaffold.path, scaffold.content, { encoding: 'utf8' });
  return true;
}

function resolveConfigPath(
  projectRoot: string,
  configOverride?: string
): string {
  if (!configOverride) {
    return path.join(projectRoot, DEFAULT_CONFIG_FILENAME);
  }

  if (path.isAbsolute(configOverride)) {
    return configOverride;
  }

  return path.resolve(projectRoot, configOverride);
}

export async function executeInit(
  options: ExecuteInitOptions = {}
): Promise<ExecuteInitResult> {
  const cwd = options.cwd ?? process.cwd();
  const projectRoot = getProjectRoot(cwd);
  const configPath = resolveConfigPath(projectRoot, options.config);
  const featuresDir = path.join(projectRoot, 'features');
  const stepsDir = path.join(projectRoot, 'bdui', 'steps');

  const directoryScaffolds: DirectoryScaffold[] = [
    { path: path.dirname(configPath) },
    { path: featuresDir },
    { path: stepsDir },
  ];

  const fileScaffolds: FileScaffold[] = [
    { path: configPath, content: SAMPLE_CONFIG_CONTENT },
    { path: path.join(featuresDir, GITKEEP_FILENAME), content: '' },
    { path: path.join(stepsDir, GITKEEP_FILENAME), content: '' },
  ];

  const createdDirectories: string[] = [];
  const skippedDirectories: string[] = [];

  for (const scaffold of directoryScaffolds) {
    const resolvedPath = path.resolve(scaffold.path);
    if (await ensureDirectory({ path: resolvedPath })) {
      createdDirectories.push(resolvedPath);
    } else {
      skippedDirectories.push(resolvedPath);
    }
  }

  const createdFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const scaffold of fileScaffolds) {
    const resolvedPath = path.resolve(scaffold.path);
    if (await ensureFile({ path: resolvedPath, content: scaffold.content })) {
      createdFiles.push(resolvedPath);
    } else {
      skippedFiles.push(resolvedPath);
    }
  }

  return {
    projectRoot,
    configPath,
    createdFiles,
    skippedFiles,
    createdDirectories,
    skippedDirectories,
  };
}
