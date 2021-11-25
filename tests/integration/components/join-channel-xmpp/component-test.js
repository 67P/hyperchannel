import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import Service from '@ember/service';

class comsStub extends Service {}

module('Integration | Component | join-channel-xmpp', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:coms', comsStub);

    const coms = this.owner.lookup('service:coms');
    coms.createChannel = function () {};
    this.set('coms', coms);

    const router = this.owner.lookup('service:router');
    router.transitionTo = function () {};
    this.set('router', router);

    const account = { id: 'xmpp-account' };
    this.set('account', account);
    this.set('close', function () {});
  });

  test('creates a channel with the given name on the passed account', async function (assert) {
    assert.expect(3);

    this.coms.createChannel = function (account, channelName) {
      assert.equal(account.id, 'xmpp-account', 'uses the selected account');
      assert.equal(
        channelName,
        'kosmos-random@kosmos.chat',
        'uses the given channel address'
      );
    };

    await render(
      hbs`<JoinChannelXmpp @account={{this.account}} @closeModal={{this.close}} />`
    );

    const channelInput = 'input[name="channel-name"]';

    assert.dom(channelInput).isFocused();

    await fillIn(channelInput, 'kosmos-random');
    await click('input[type="submit"]');
  });

  test('it sends the user to the created channel', async function (assert) {
    assert.expect(2);

    this.coms.createChannel = function () {
      return 'channel-model';
    };

    this.router.transitionTo = function (route, model) {
      assert.equal(route, 'channel');
      assert.equal(model, 'channel-model');
    };

    await render(
      hbs`<JoinChannelXmpp @account={{this.account}} @closeModal={{this.close}} />`
    );

    await fillIn('input[name="channel-name"]', 'kosmos-random');
    await click('input[type="submit"]');
  });

  test('it closes the modal when finished', async function (assert) {
    assert.expect(1);

    this.set('close', function () {
      assert.ok(true);
    });

    await render(
      hbs`<JoinChannelXmpp @account={{this.account}} @closeModal={{this.close}} />`
    );

    await fillIn('input[name="channel-name"]', 'kosmos-random');
    await click('input[type="submit"]');
  });
});
