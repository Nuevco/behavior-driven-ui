import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    globals: true,
    reporters: 'default',
    coverage: {
      enabled: false,
    },
  },
});
