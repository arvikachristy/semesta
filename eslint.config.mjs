import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/no-multi-comp': ['error', { ignoreStateless: false }],
    },
  },
  globalIgnores(['.next/**', 'dist/**', 'node_modules/**']),
]);
