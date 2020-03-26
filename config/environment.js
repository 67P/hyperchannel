'use strict';

const fs = require('fs');
let spacePresets = JSON.parse(fs.readFileSync('config/space-presets.json'));

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'hyperchannel',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },
    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
    sockethubURL: 'http://localhost:10550',
    publicLogsUrl: 'https://storage.5apps.com/kosmos/public/chat-messages',
    spacePresets: spacePresets,
    defaultSpaceId: 'freenode'
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    ENV.defaultSpaceId = 'freenode';
    ENV.sockethubURL = 'https://sockethub.kosmos.org:10550';
  }

  return ENV;
};
