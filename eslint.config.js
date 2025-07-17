import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import * as reactHooks from 'eslint-plugin-react-hooks';

const reactPlugin = require('eslint-plugin-react');
const globals = require('globals');

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooks.configs.recommended,
  {
    // Base configuration for all files
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      reactPlugin,
      pluginReactHooks,
      pluginJsxA11y,
    },
  },
  { ignores: ['node_modules', 'dist'] },
  eslintConfigPrettier, // needs to be last?
);
