/* eslint-env node */
/* global require, module */
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
var autoprefixer = require('autoprefixer');

module.exports = function(defaults) {

  const inlineContent = {};

  if (process.env.EMBER_ENV.match(/^(staging|production)$/)) {
    inlineContent['sockethub-assets'] = 'vendor/sh-assets-remote.html';
  } else {
    inlineContent['sockethub-assets'] = 'vendor/sh-assets-local.html';
  }

  const app = new EmberApp(defaults, {
    fingerprint: { enabled: false },
    inlineContent: inlineContent,
    sourcemaps: { // enabled sourcemaps for all environments (e.g. for sentry integration)
      enabled: true,
      extensions: ['js']
    },
    sassOptions: {
      includePaths: [
        'bower_components/bourbon/app/assets/stylesheets'
      ]
    },
    postcssOptions: {
      compile: {
        enabled: false
      },
      filter: {
        enabled: true,
        exclude: ['assets/vendor.css'],
        plugins: [
          {
            module: autoprefixer,
            options: {
              browsers: ['last 4 versions']
            }
          }
        ]
      }
    }
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  app.import('bower_components/linkifyjs/linkify.min.js');
  app.import('bower_components/linkifyjs/linkify-string.min.js');
  app.import('bower_components/inobounce/inobounce.js');

  return app.toTree();
};
