import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import pixelAgentsPlugin from '../eslint-rules/ai-pixel-office-rules.mjs';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'ai-pixel-office': pixelAgentsPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // These react-hooks rules misfire on this project's imperative game-state patterns:
      // - immutability: singleton OfficeState/EditorState mutations are by design
      // - refs: containerRef reads during render feed canvas pipeline, not React state
      // - set-state-in-effect: timer-based animations and async error handling are legitimate
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'ai-pixel-office/no-inline-colors': 'error',
      'ai-pixel-office/pixel-shadow': 'error',
      'ai-pixel-office/pixel-font': 'error',
    },
  },
  {
    files: ['src/constants.ts', 'src/fonts/**', 'src/office/sprites/**'],
    rules: {
      'ai-pixel-office/no-inline-colors': 'off',
      'ai-pixel-office/pixel-shadow': 'off',
      'ai-pixel-office/pixel-font': 'off',
    },
  },
  eslintConfigPrettier,
]);
