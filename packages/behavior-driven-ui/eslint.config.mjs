/* eslint-env node */
import { URL as NodeURL, fileURLToPath } from 'node:url';

import rootConfig from '../../eslint.config.js';

const tsconfigRootDir = fileURLToPath(new NodeURL('.', import.meta.url));

export default [
  ...rootConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir,
      },
    },
  },
  {
    ignores: ['dist/**/*', '*.d.ts', '*.d.mts'],
  },
];
