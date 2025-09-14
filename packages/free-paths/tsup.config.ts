import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry point
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
  minify: false,

  // External dependencies (don't bundle)
  external: ['callsites', 'pkg-dir'],

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