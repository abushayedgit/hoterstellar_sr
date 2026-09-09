import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.js'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'src/emails/templates/**',
      'eslint.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'no-duplicate-imports': 'off',
      'no-multiple-empty-lines': 'off',
      'no-trailing-spaces': 'off',
      semi: 'off',
      quotes: 'off',
      indent: 'off',
      'comma-dangle': 'off',
      'arrow-spacing': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'func-call-spacing': 'off',
      'keyword-spacing': 'off',
      'space-before-blocks': 'off',
      'space-infix-ops': 'off',
      'eol-last': 'off',
      camelcase: 'off',
      'no-undef': 'off',
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
    },
  },
];
