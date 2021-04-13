'use strict';

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true
    }
  },
  plugins: [
    'ember'
  ],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended'
  ],
  env: {
    browser: true
  },
  rules: {
    "no-control-regex": "off",
    "no-console": ["error", { allow: ["warn", "debug", "error"] }],
    "ember/no-observers": "warn",
    "ember/no-jquery": "error",
    "ember/no-string-prototype-extensions": "warn",
    "ember/no-controller-access-in-routes": "warn",
    "ember/no-classic-classes": "warn",
    "ember/no-computed-properties-in-native-classes": "warn",
    "ember/require-tagless-components": "warn",
    "ember/no-assignment-of-untracked-properties-used-in-tracking-contexts": "warn",
    "ember/no-side-effects": "warn"
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'testem.js',
        'config/**/*.js',
        'lib/*/index.js',
        'server/**/*.js'
      ],
      parserOptions: {
        sourceType: 'script'
      },
      env: {
        browser: false,
        node: true
      },
      rules: {
        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        'node/no-unpublished-require': 'off'
      }
    }
  ]
};
