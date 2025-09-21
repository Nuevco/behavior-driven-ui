import { beforeEach, expect, it, vi } from 'vitest';

const loaderModulePath = '../../src/cli/runtime/register-loaders.ts';

beforeEach(() => {
  vi.resetModules();
});

it('registers tsx only once', async () => {
  const registerMock = vi.fn();
  vi.doMock('tsx/esm/api', () => ({
    register: registerMock,
  }));

  const { ensureLoadersRegistered } = (await import(
    loaderModulePath
  )) as typeof import('../../src/cli/runtime/register-loaders');

  await ensureLoadersRegistered();
  await ensureLoadersRegistered();

  expect(registerMock).toHaveBeenCalledTimes(1);
});

it('throws when tsx.register is unavailable', async () => {
  vi.doMock('tsx/esm/api', () => ({}));
  vi.doMock('tsx', () => ({}));

  const { ensureLoadersRegistered } = (await import(
    loaderModulePath
  )) as typeof import('../../src/cli/runtime/register-loaders');

  await expect(ensureLoadersRegistered()).rejects.toThrow(
    /Failed to register TypeScript\/ESM loaders/
  );
});
