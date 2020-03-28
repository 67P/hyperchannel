'use strict';

module.exports = {
  extends: 'octane',

  rules: {
    'no-invalid-interactive': false,
    'link-href-attributes': false
  },

  ignore: [
    'hyperchannel/templates/components/**',
    'app/templates/components/**'
  ],

  pending: [
  ]
};
