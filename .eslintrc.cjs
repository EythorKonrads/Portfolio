/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
    root: true,
    extends: ['plugin:vue/vue3-essential', 'eslint:recommended', 'plugin:vue/vue3-recommended'],
    plugins: ['prettier', 'cypress'],
    env: {
        browser: true,
        es6: true,
        node: true,
        'vue/setup-compiler-macros': true,
        'cypress/globals': true,
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
        'vue/valid-attribute-name': 'off',
        'vue/html-indent': 'off',
        indent: 'off',
    },
    ignorePatterns: ['node_modules', 'build', 'dist', 'public'],
    parserOptions: {
        project: './vite.config.js',
        sourceType: 'module',
    },
    overrides: [
        {
            files: ['src/**/*.ts', 'src/**/*.tsx', 'vite.config.js'],
        },
    ],
}
