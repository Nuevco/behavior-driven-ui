import rootConfig from '../../eslint.config.js';

export default [
  ...rootConfig,
  {
    languageOptions: {
      globals: {
        // Node.js globals for ESM
        process: 'readonly',
        console: 'readonly',

        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    }
  }
];