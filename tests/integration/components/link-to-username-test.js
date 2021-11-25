import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Channel from 'hyperchannel/models/channel';
import { xmppAccount } from '../../fixtures/accounts';

const xmppChannel = new Channel({
  account: xmppAccount,
  name: 'kosmos-dev@kosmos.chat',
});

module('Integration | Component | link to username', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders for a normal user', async function (assert) {
    this.set('channel', xmppChannel);
    await render(
      hbs`<LinkToUsername @username='test_user' @channel={{this.channel}} />`
    );

    const link = this.element.querySelector('a');

    assert.equal(link.innerText, 'test_user');
    assert.ok(link.className.includes('normal'));
  });

  test('it renders for an op user', async function (assert) {
    this.set('channel', xmppChannel);
    await render(
      hbs`<LinkToUsername @username='@op' @channel={{this.channel}} />`
    );

    const link = this.element.querySelector('a');

    assert.equal(link.innerText, '@op');
    assert.ok(link.className.includes('op'));
  });

  test('it renders for a half-op user', async function (assert) {
    this.set('channel', xmppChannel);
    await render(
      hbs`<LinkToUsername @username='%wannabe_op' @channel={{this.channel}} />`
    );

    const link = this.element.querySelector('a');

    assert.equal(link.innerText, '%wannabe_op');
    assert.ok(link.className.includes('half-op'));
  });
});
