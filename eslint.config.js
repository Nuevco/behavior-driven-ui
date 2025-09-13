import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
import promisePlugin from 'eslint-plugin-promise';
import nodePlugin from 'eslint-plugin-n';
import js from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global ignores first
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.turbo/**',
      'coverage/**',
      '.claude/**',
      '.claude-flow/**',
      '.hive-mind/**',
      '.swarm/**',
      'memory/**',
      'coordination/**',
      'claude-flow*',
      '*.config.js',
      '*.config.ts',
    ],
  },

  // Apply to TypeScript and JavaScript files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: prettierPlugin,
      import: importPlugin,
      security: securityPlugin,
      promise: promisePlugin,
      n: nodePlugin,
    },
    rules: {
      // Extend TypeScript strict rules
      ...typescriptEslint.configs.strict.rules,
      ...typescriptEslint.configs.stylistic.rules,

      // ULTRA-STRICT TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',

      // Strict coding standards
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-return-assign': 'error',
      'no-sequences': 'error',
      'no-unused-expressions': 'off', // Use TypeScript version
      'no-void': 'error',
      'no-with': 'error',

      // Import/Export Management Rules (CRITICAL FOR MONOREPO)
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
        },
      ],
      'no-duplicate-imports': 'off', // Use import/no-duplicates instead
      'sort-imports': ['error', { ignoreDeclarationSort: true }],

      // Security Rules (PREVENT VULNERABILITIES)
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // Promise/Async Rules (PREVENT ASYNC BUGS)
      'promise/always-return': 'error',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-native': 'off', // Allow native promises
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-callback-in-promise': 'warn',
      'promise/avoid-new': 'off', // Allow new Promise()
      'promise/no-new-statics': 'error',
      'promise/no-return-in-finally': 'warn',
      'promise/valid-params': 'warn',

      // Node.js Best Practices
      'n/no-deprecated-api': 'error',
      'n/no-extraneous-import': 'error',
      'n/no-missing-import': 'error',
      'n/no-unpublished-import': 'error',
      'n/prefer-global/buffer': 'error',
      'n/prefer-global/console': 'error',
      'n/prefer-global/process': 'error',
      'n/prefer-global/url': 'error',
      'n/prefer-promises/fs': 'error',

      // Code Complexity Rules (PREVENT UNMAINTAINABLE CODE)
      complexity: ['error', { max: 15 }],
      'max-depth': ['error', 4],
      'max-lines': ['error', { max: 500, skipBlankLines: true }],
      'max-lines-per-function': ['error', { max: 100, skipBlankLines: true }],
      'max-nested-callbacks': ['error', 4],
      'max-params': ['error', 5],

      // Prettier integration
      'prettier/prettier': [
        'error',
        {
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
        },
      ],
    },
  },

  // JavaScript-only rules
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Basic strict rules for JS files
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Prettier for JS
      'prettier/prettier': [
        'error',
        {
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
        },
      ],
    },
  },

  // Prettier config (must be last to override conflicting rules)
  prettierConfig,
];
