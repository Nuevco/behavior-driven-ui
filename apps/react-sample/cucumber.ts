import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runBduiFeatures } from 'behavior-driven-ui/cucumber';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const result = await runBduiFeatures({
  cwd: currentDir,
  features: ['features/**/*.feature'],
});

if (!result.success) {
  process.exitCode = 1;
}
