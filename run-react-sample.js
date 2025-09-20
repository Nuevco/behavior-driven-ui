import path from 'node:path';
import { runBduiFeatures } from './packages/behavior-driven-ui/dist/cucumber/index.js';

const cwd = path.resolve('apps/react-sample');

const result = await runBduiFeatures({
  cwd,
  features: ['features/**/*.feature'],
  formats: { stdout: 'summary' },
});

console.log('Success?', result.success);
if (!result.success) process.exit(1);
