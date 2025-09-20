import { defineConfig } from 'tsup';

export default defineConfig({
  // Build both the root entry and the cucumber subpath so exported files exist on disk
  entry: {
    index: 'src/index.ts',
    'cucumber/index': 'src/cucumber/index.ts',
  },

  // Multiple output formats
  format: ['esm', 'cjs'],

  // Output files
  outDir: 'dist',

  // Generate TypeScript declarations
  dts: true,

  // Clean dist directory before build
  clean: true,

  // Avoid chunk-splitting so Node 20.x ESM loader sees named exports reliably
  splitting: false,

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
