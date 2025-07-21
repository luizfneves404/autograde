import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Global ignores should come first
  {
    ignores: ['dist/', 'eslint.config.js'], // 'node_modules' is ignored by default
  },

  // Recommended baseline configurations
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked, // Use spread operator for type-aware configs
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooks.configs['recommended-latest'],

  // Custom configuration for your project files
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^_' },
      ],
    },
  },

  // Prettier config must be last to override other styling rules
  eslintConfigPrettier,
);
