import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import pluginCypress from 'eslint-plugin-cypress';
import prettierConfig from '@vue/eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'dist-ssr/**',
      'build/**',
      'coverage/**',
      'public/**',
      'cypress/videos/**',
      'cypress/screenshots/**',
      // Written by wrangler dev: bundled Worker and local data
      '.wrangler/**',
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'off',
      'vue/no-v-html': 'off',
      'no-async-promise-executor': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'any',
            normal: 'never',
            component: 'any',
          },
          svg: 'always',
          math: 'always',
        },
      ],
      'vue/no-template-target-blank': 'error',
      'vue/valid-attribute-name': 'off',
      'vue/html-indent': 'off',
      indent: 'off',
    },
  },
  {
    files: ['cypress/**/*.js'],
    ...pluginCypress.configs.globals,
  },
  {
    files: ['cypress/**/*.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='cy'][callee.property.name='visit']",
          message: 'Use cy.visitHome(), which fails on any console.error.',
        },
        {
          selector:
            "CallExpression[callee.object.name='Cypress'][callee.property.name='env']",
          message:
            'Cypress.env() was removed in Cypress 16. Use Cypress.expose() or cy.env().',
        },
      ],
    },
  },
];
