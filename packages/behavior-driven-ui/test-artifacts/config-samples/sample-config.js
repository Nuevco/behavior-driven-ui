// Test artifact - sample JavaScript config file for testing loader capabilities
// This file should NOT be part of the build but should be loadable by tests

const testConfig = {
  name: 'test-artifact-config-js',
  version: '1.0.0',
  features: ['js-feature1', 'js-feature2'],
  driver: {
    kind: 'mock',
    browser: 'chromium',
    headless: false,
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    baseURL: 'http://localhost:5173',
  },
};

module.exports = testConfig;
