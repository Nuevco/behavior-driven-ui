/**
 * behavior-driven-ui - Main package entry point
 *
 * This package provides a complete behavior-driven UI testing framework
 * with internal modules for core functionality, drivers, runners, presets, and CLI.
 */

// Core functionality exports
export * from './core/index.js';

// Driver implementations exports
export * from './drivers/index.js';

// Runner implementations exports
export * from './runners/index.js';

// Preset step definitions exports
export * from './presets/index.js';

// CLI functionality exports (for programmatic use)
export * from './cli/index.js';
