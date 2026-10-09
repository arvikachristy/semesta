import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

const GlobalAccess = { ReadOnly: 'readonly' };

export default defineConfig([
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: GlobalAccess.ReadOnly,
        console: GlobalAccess.ReadOnly,
        window: GlobalAccess.ReadOnly,
        document: GlobalAccess.ReadOnly,
        performance: GlobalAccess.ReadOnly,
      },
    },
  },
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
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/components/ui/**', '**/*.spec.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="button"]',
          message:
            'Use the shared Button and ButtonVariant from components/ui/button. See docs/design-system.md.',
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'dist/**', 'node_modules/**']),
]);
