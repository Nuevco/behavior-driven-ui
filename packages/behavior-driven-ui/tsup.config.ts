import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry point - main package exports
  entry: ['src/index.ts'],

  // Multiple output formats
  format: ['esm', 'cjs'],

  // Output files
  outDir: 'dist',

  // Generate TypeScript declarations
  dts: true,

  // Clean dist directory before build
  clean: true,

  // Split chunks for better tree-shaking
  splitting: true,

  // Source maps for debugging
  sourcemap: true,

  // Target modern environments
  target: 'node18',

  // Bundle internal modules together
  bundle: true,

  // Minify production builds
  minify: false, // Keep readable for now during development

  // External dependencies (don't bundle)
  external: ['@playwright/test', '@cucumber/cucumber', 'commander'],

  // Output naming
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },

  // Tree-shaking configuration
  treeshake: true,

  // Platform targeting
  platform: 'node',
});
