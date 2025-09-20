import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as BduiCucumber from 'behavior-driven-ui/cucumber';
import type { runBduiFeatures as RunBduiFeaturesExport } from 'behavior-driven-ui/cucumber';

type RunBduiFeatures = typeof RunBduiFeaturesExport;

function resolveRunBduiFeatures(): RunBduiFeatures {
  if (
    'runBduiFeatures' in BduiCucumber &&
    typeof BduiCucumber.runBduiFeatures === 'function'
  ) {
    return BduiCucumber.runBduiFeatures;
  }

  const defaultExport = (BduiCucumber as { default?: unknown }).default;
  if (
    defaultExport &&
    typeof (defaultExport as Record<string, unknown>).runBduiFeatures === 'function'
  ) {
    return (defaultExport as { runBduiFeatures: RunBduiFeatures }).runBduiFeatures;
  }

  throw new Error('behavior-driven-ui/cucumber did not expose runBduiFeatures');
}

const runBduiFeatures = resolveRunBduiFeatures();

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const result = await runBduiFeatures({
  cwd: currentDir,
  features: ['features/**/*.feature'],
});

if (!result.success) {
  process.exitCode = 1;
}
