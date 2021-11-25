import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import urlBase64ToUint8Array from 'hyperchannel/utils/url-base64-to-uint8-array';

export default class WebPushSubscription extends Component {
  @tracked subscribed = false;

  get webPushBaseURL() {
    return this.args.botkaURL + '/web-push';
  }

  constructor() {
    super(...arguments);

    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.pushManager.getSubscription();
      })
      .then((subscription) => {
        if (subscription) {
          this.subscribed = true;
        }
      });
  }

  @action
  subscribe() {
    navigator.serviceWorker.ready
      .then(async (registration) => {
        // Get the server's public key
        const response = await fetch(this.webPushBaseURL + '/vapid-public-key');
        const vapidPublicKey = await response.text();
        // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        // Subscribe the user
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      })
      .then((subscription) => {
        console.debug('Subscribed', subscription.endpoint);
        return fetch(this.webPushBaseURL + '/register', {
          method: 'post',
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify({
            user: this.args.username,
            subscription: subscription,
          }),
        });
      })
      .then(() => {
        this.subscribed = true;
      });
  }

  @action
  unsubscribe() {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.pushManager.getSubscription();
      })
      .then((subscription) => {
        return subscription.unsubscribe().then(() => {
          console.debug('Unsubscribed', subscription.endpoint);
          return fetch(this.webPushBaseURL + '/unregister', {
            method: 'post',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ subscription: subscription }),
          });
        });
      })
      .then(() => {
        this.subscribed = false;
      });
  }
}
