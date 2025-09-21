interface TsxModule {
  register?: (options?: Record<string, unknown>) => void;
}

let loadersRegistered = false;

async function loadTsxModule(): Promise<TsxModule> {
  try {
    return (await import('tsx/esm/api')) as TsxModule;
  } catch (error) {
    const maybeCode =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined;
    if (maybeCode !== 'ERR_MODULE_NOT_FOUND') {
      const cause =
        error instanceof Error
          ? error
          : new Error(String(error ?? 'Unknown loader error'));
      throw cause;
    }
  }

  return (await import('tsx')) as TsxModule;
}

export async function ensureLoadersRegistered(): Promise<void> {
  if (loadersRegistered) {
    return;
  }

  try {
    const tsxModule = await loadTsxModule();
    if (typeof tsxModule.register !== 'function') {
      throw new Error('tsx.register was not available');
    }

    tsxModule.register({
      jsx: 'preserve',
      format: { '\\.(tsx?)$': 'module' },
    });

    loadersRegistered = true;
  } catch (error) {
    const cause =
      error instanceof Error
        ? error
        : new Error(String(error ?? 'Unknown loader error'));
    throw new Error(
      'Failed to register TypeScript/ESM loaders via tsx. Install "tsx" or configure a loader manually.',
      { cause }
    );
  }
}
