/* global module, require */
/* eslint-env node */
const fs = require('fs');
let spacePresets = JSON.parse(fs.readFileSync('config/space-presets.json'));

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'hyperchannel',
    environment: environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },
    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
    sockethubURL: 'http://localhost:10550',
    publicLogsUrl: 'https://storage.5apps.com/kosmos/public/chat-messages',
    spacePresets: spacePresets
  };

  //
  // Service Worker
  //
  ENV.serviceWorker = {
    enabled: false,
    includeRegistration: false,
    debug: true,
    // precacheURLs: [
    // ],
    networkFirstURLs: [
      /activity\-streams\.js/,
      /socket\.io\.js/,
      /sockethub\-client\.js/
    ],
    excludePaths: [/test.*/, 'robots.txt', 'crossdomain.xml']
    // fallback: [
    //   '/online.html /offline.html'
    // ],
    // serviceWorkerFile: "service-worker.js",
    // skipWaiting: true,
    // swIncludeFiles: [
    //   'bower_components/pouchdb/dist/pouchdb.js'
    // ],
    // swEnvironment: {
    // }
  };

  if (environment === 'development') {
    // ENV.serviceWorker.enabled = true;
    // ENV.serviceWorker.includeRegistration = true;
    // ENV.serviceWorker.debug = true;
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;

    ENV.serviceWorker.enabled = true;
    ENV.serviceWorker.includeRegistration = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {
    ENV.sockethubURL = 'https://sockethub.kosmos.org:10550';

    ENV.serviceWorker.enabled = true;
    ENV.serviceWorker.includeRegistration = true;
  }

  return ENV;
};
