import js from '@eslint/js'

const browserGlobals = Object.fromEntries(
  [
    'AbortController',
    'addEventListener',
    'alert',
    'atob',
    'Blob',
    'btoa',
    'BroadcastChannel',
    'cancelAnimationFrame',
    'clearInterval',
    'clearTimeout',
    'confirm',
    'console',
    'CustomEvent',
    'document',
    'Element',
    'Event',
    'EventTarget',
    'fetch',
    'File',
    'FileList',
    'FormData',
    'Headers',
    'history',
    'IntersectionObserver',
    'localStorage',
    'location',
    'matchMedia',
    'MessageChannel',
    'MessagePort',
    'MutationObserver',
    'navigator',
    'Notification',
    'performance',
    'prompt',
    'queueMicrotask',
    'removeEventListener',
    'requestAnimationFrame',
    'Response',
    'sessionStorage',
    'setInterval',
    'setTimeout',
    'URL',
    'URLSearchParams',
    'WebSocket',
    'window',
    'Worker',
  ].map((name) => [name, 'readonly']),
)
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: browserGlobals,
    },
  },
])
