'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const tailwind = require('tailwindcss');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    fingerprint: { enabled: false },
    sourcemaps: {
      // enabled sourcemaps for all environments (e.g. for sentry integration)
      enabled: true,
      extensions: ['js'],
    },
    postcssOptions: {
      compile: {
        enabled: true,
        extension: 'scss',
        parser: require('postcss-scss'),
        cacheExclude: [],
        cacheInclude: [
          /.*\.(css|scss|sass|hbs|html)$/,
          /tailwindcss-config\.js$/,
        ],
        plugins: [
          {
            module: require('@csstools/postcss-sass'),
            options: {
              // includePaths: [
              //   'node_modules/tachyons-sass',
              // ],
              silenceDeprecations: ['import', 'global-builtin', 'legacy-js-api'],
            },
          },
          {
            module: tailwind,
            options: {
              config: './config/tailwindcss-config.js',
            },
          },
        ],
      },
    },
    emberData: {
      deprecations: {
        // New projects can safely leave this deprecation disabled.
        // If upgrading, to opt-into the deprecated behavior, set this to true and then follow:
        // https://deprecations.emberjs.com/id/ember-data-deprecate-store-extends-ember-object
        // before upgrading to Ember Data 6.0
        DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: false,
      },
    },
  });

  app.import('node_modules/inobounce/inobounce.js');

  return app.toTree();
};
