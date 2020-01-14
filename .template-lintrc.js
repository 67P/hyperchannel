'use strict';

module.exports = {
  extends: 'octane',

  rules: {
    'no-invalid-interactive': false
  },

  ignore: [
    'hyperchannel/templates/components/**',
    'app/templates/components/**'
  ],

  pending: [
    {
      "moduleId": "app/templates/settings",
      "only": [
        "no-action"
      ]
    },
    {
      "moduleId": "app/components/channel-container/template",
      "only": [
        "link-rel-noopener",
        "link-href-attributes",
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "app/components/channel-nav/template",
      "only": [
        "link-href-attributes",
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "app/components/date-headline/template",
      "only": [
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "app/components/link-to-username/template",
      "only": [
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "app/components/message-chat/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "app/components/message-chat-me/template",
      "only": [
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "app/components/message-input/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "app/components/modal-target/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "app/components/notification-topic-change/template",
      "only": [
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "app/components/space-setting-modal/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this",
        "require-button-type"
      ]
    },
    {
      "moduleId": "app/components/user-list/template",
      "only": [
        "no-action",
        "no-curly-component-invocation"
      ]
    },
    {
      "moduleId": "app/components/web-push-subscription/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this",
        "require-button-type"
      ]
    },
    {
      "moduleId": "app/templates/space/channel",
      "only": [
        "no-action"
      ]
    },
    {
      "moduleId": "app/templates/space/user_channel",
      "only": [
        "no-action"
      ]
    },
    {
      "moduleId": "hyperchannel/components/channel-container/template",
      "only": [
        "link-rel-noopener",
        "link-href-attributes",
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "hyperchannel/components/channel-nav/template",
      "only": [
        "link-href-attributes",
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "hyperchannel/components/date-headline/template",
      "only": [
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "hyperchannel/components/link-to-username/template",
      "only": [
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "hyperchannel/components/message-chat-me/template",
      "only": [
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "hyperchannel/components/message-chat/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "hyperchannel/components/message-input/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "hyperchannel/components/modal-target/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "hyperchannel/components/notification-topic-change/template",
      "only": [
        "no-curly-component-invocation",
        "no-implicit-this"
      ]
    },
    {
      "moduleId": "hyperchannel/components/space-setting-modal/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this",
        "require-button-type"
      ]
    },
    {
      "moduleId": "hyperchannel/components/user-list/template",
      "only": [
        "no-action",
        "no-curly-component-invocation"
      ]
    },
    {
      "moduleId": "hyperchannel/components/web-push-subscription/template",
      "only": [
        "no-action",
        "no-curly-component-invocation",
        "no-implicit-this",
        "require-button-type"
      ]
    },
    {
      "moduleId": "hyperchannel/templates/settings",
      "only": [
        "no-action"
      ]
    },
    {
      "moduleId": "hyperchannel/templates/space/channel",
      "only": [
        "no-action"
      ]
    },
    {
      "moduleId": "hyperchannel/templates/space/user_channel",
      "only": [
        "no-action"
      ]
    }
  ]
};
