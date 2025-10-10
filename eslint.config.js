import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
    rules: {
      'no-console': 'off',
      'class-methods-use-this': 'off',
      'no-unused-vars': ['warn', {args: 'none', vars: 'all', varsIgnorePattern: '^_'}],
    },
  },
];
