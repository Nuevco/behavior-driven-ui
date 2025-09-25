import { getLoaderRegistry } from '../../core/loader-registry.js';

/**
 * @deprecated Use LoaderRegistry.getInstance().registerLoaders() instead
 * This function is maintained for backward compatibility
 */
export async function ensureLoadersRegistered(): Promise<void> {
  const registry = getLoaderRegistry();
  await registry.registerLoaders();
}
