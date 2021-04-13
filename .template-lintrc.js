'use strict';

module.exports = {
  extends: 'octane',

  rules: {
    'no-invalid-interactive': false,
    'link-href-attributes': false,
    'no-duplicate-landmark-elements': false,
    'require-input-label': 'warn'
  },

  ignore: [
    'hyperchannel/templates/components/**',
    'app/templates/components/**'
  ],

  pending: [
  ]
};
