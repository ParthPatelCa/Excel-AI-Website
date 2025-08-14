import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: [
      'dist',
      'playwright-report',
      'test-results',
      'node_modules',
      // Optional: ignore tests if they aren't maintained for lint
      // 'tests/**',
    ],
  },
  // Node/config files (allow process, __dirname, etc.)
  {
    files: [
      '**/*.config.js',
      'playwright.config.js',
      'vite.config.js',
      'tests/**',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: { sourceType: 'module' },
      globals: {
        ...globals.node,
        process: true,
        __dirname: true,
        module: true,
        require: true,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Relax rules that don't apply well to test/config code
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]|^_', argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
  // Frontend React app
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Common globals used in app code
        React: true,
        process: true,
        dataLayer: true,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // So pre-existing unused variables do not break CI; prefix _ to ignore
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]|^_', argsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
