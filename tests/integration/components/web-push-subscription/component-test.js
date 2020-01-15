import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | web-push-subscription', function(hooks) {
  setupRenderingTest(hooks);

  test('it shows the correct button', async function(assert) {
    this.set('subscribed', false);
    await render(hbs`{{web-push-subscription subscribed=subscribed}}`);
    assert.ok(this.element.querySelector('button').innerText.match('Receive'));

    this.set('subscribed', true);
    await render(hbs`{{web-push-subscription subscribed=subscribed}}`);
    assert.ok(this.element.querySelector('button').innerText.match('Disable'));
  });
});
