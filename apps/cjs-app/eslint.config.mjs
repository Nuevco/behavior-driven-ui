import rootConfig from '../../eslint.config.js';

export default [
  ...rootConfig,
  {
    languageOptions: {
      globals: {
        // Node.js globals for CJS
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
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