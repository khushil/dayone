// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * DayONE lint config — the Google TypeScript Style Guide
 * (https://google.github.io/styleguide/tsguide.html) encoded as an ESLint 9
 * flat config. ESLint enforces the mechanical rules; Prettier owns formatting.
 * See docs/CODING_STANDARDS.md for what is tool-enforced vs guide convention.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules',
      '**/out',
      '**/dist',
      '**/coverage',
      'build/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Node environment for plain JS/MJS tooling (scripts, configs).
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node } },
  },

  // React + accessibility for the renderer.
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    ...react.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    ...react.configs.flat['jsx-runtime'],
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // Google TS Style rules, applied to all our source.
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,mts,mjs}', 'tests/**/*.ts'],
    plugins: { import: importPlugin },
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'objectLiteralProperty', format: null },
        { selector: 'import', format: null },
      ],
    },
  },

  // The guide bans default exports — but only in our application code.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { import: importPlugin },
    rules: { 'import/no-default-export': 'error' },
  },

  // Config/entry files MUST default-export; exempt them (documented deviation #2).
  {
    files: [
      '*.config.{ts,mts,js,mjs}',
      'electron.vite.config.ts',
      'vite.config.ts',
      'vitest.config.ts',
      'cucumber.*',
    ],
    rules: { 'import/no-default-export': 'off' },
  },

  // Tests may use dev-only patterns.
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  prettier,
);
