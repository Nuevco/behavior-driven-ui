interface TsxModule {
  register?: (options?: Record<string, unknown>) => void;
}

let loadersRegistered = false;

export async function ensureLoadersRegistered(): Promise<void> {
  if (loadersRegistered) {
    return;
  }

  try {
    const tsxModule = (await import('tsx')) as TsxModule;
    if (typeof tsxModule.register !== 'function') {
      throw new Error('tsx.register was not available');
    }

    tsxModule.register({
      jsx: 'preserve',
      format: { '\\.(tsx?)$': 'module' },
    });

    loadersRegistered = true;
  } catch (error) {
    throw new Error(
      'Failed to register TypeScript/ESM loaders via tsx. Install "tsx" or configure a loader manually.',
      { cause: error }
    );
  }
}
