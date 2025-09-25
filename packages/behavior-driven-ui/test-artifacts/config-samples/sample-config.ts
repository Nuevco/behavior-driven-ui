// Test artifact - sample TypeScript config file for testing loader capabilities
// This file should NOT be part of the build but should be loadable by tests

export const testConfig = {
  name: 'test-artifact-config',
  version: '1.0.0',
  features: ['feature1', 'feature2'],
  driver: {
    kind: 'playwright' as const,
    browser: 'chromium' as const,
    headless: true,
  },
  webServer: {
    command: 'npm start',
    port: 3000,
    baseURL: 'http://localhost:3000',
  },
};

export default testConfig;