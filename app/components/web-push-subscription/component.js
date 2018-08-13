import Component from '@ember/component';
import { computed } from '@ember/object';
import urlBase64ToUint8Array from 'hyperchannel/utils/url-base64-to-uint8-array';

export default Component.extend({

  botkaURL: null,
  username: null,
  subscribed: false,

  webPushBaseURL: computed('botkaURL', function() {
    return this.botkaURL + '/web-push';
  }),

  init () {
    this._super(...arguments);

    navigator.serviceWorker.ready.then(registration => {
      return registration.pushManager.getSubscription();
    }).then(subscription => {
      if (subscription) { this.set('subscribed', true); }
    });
  },

  actions: {

    subscribe () {
      navigator.serviceWorker.ready.then(async function(registration) {
        // Get the server's public key
        const response = await fetch(this.webPushBaseURL+'/vapid-public-key');
        const vapidPublicKey = await response.text();
        // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        // Subscribe the user
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }.bind(this)).then(subscription => {
        console.debug('Subscribed', subscription.endpoint);
        return fetch(this.webPushBaseURL+'/register', {
          method: 'post',
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify({
            user: this.username,
            subscription: subscription
          })
        });
      }).then(this.set('subscribed', true));
    },

    unsubscribe () {
      navigator.serviceWorker.ready.then(registration => {
        return registration.pushManager.getSubscription();
      }).then(subscription => {
        return subscription.unsubscribe()
          .then(() => {
            console.debug('Unsubscribed', subscription.endpoint);
            return fetch(this.webPushBaseURL+'/unregister', {
              method: 'post',
              headers: { 'Content-type': 'application/json' },
              body: JSON.stringify({ subscription: subscription })
            });
          });
      }).then(this.set('subscribed', false));
    }

  }

});
