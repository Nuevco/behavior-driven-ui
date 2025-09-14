# behavior-driven-ui-jest

Jest runner implementation for behavior-driven-ui framework.

## Installation

```bash
npm install behavior-driven-ui-jest
# or
pnpm add behavior-driven-ui-jest
```

## Usage

```typescript
import { JestRunner, createBehaviorDrivenJestRunner } from 'behavior-driven-ui-jest';

// Create a standard Jest runner
const runner = new JestRunner({
  testTimeout: 30000,
  testEnvironment: 'jsdom',
  collectCoverage: true,
});

// Or create with behavior-driven defaults
const bdRunner = createBehaviorDrivenJestRunner({
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
});

// Run tests
const results = await runner.runTests(['**/*.feature.test.ts']);
console.log(`Tests passed: ${results.success}`);
```

## Configuration

The Jest runner supports the following configuration options:

- `jestConfig`: Standard Jest configuration object
- `testTimeout`: Test timeout in milliseconds
- `setupFiles`: Setup files to run before tests
- `setupFilesAfterEnv`: Setup files to run after environment setup
- `testEnvironment`: Test environment (jsdom, node, etc.)
- `testNamePattern`: Test name patterns to run
- `testMatch`: Test file patterns
- `collectCoverage`: Enable coverage collection
- `coverageThreshold`: Coverage threshold requirements

## Features

- Integration with jest-cucumber for Gherkin feature files
- Behavior-driven test defaults and configuration
- Coverage reporting and thresholds
- Watch mode support
- ESM and TypeScript support

## Requirements

- Node.js 18+
- behavior-driven-ui (peer dependency)
- Jest and jest-cucumber

## License

MIT