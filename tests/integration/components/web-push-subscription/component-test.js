import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | web-push-subscription', function(hooks) {
  setupRenderingTest(hooks);

  test('it shows the correct button', async function(assert) {
    // TODO mock navigator.serviceWorker
    // this.subscribed = false;
    await render(hbs`<WebPushSubscription @subscribed={{this.subscribed}} />`);
    assert.dom('button').hasText(/^Receive/);

    // this.subscribed = true;
    // await render(hbs`<WebPushSubscription @subscribed={{this.subscribed}} />`);
    // assert.ok(this.element.querySelector('button').innerText.match('Disable'));
  });
});
